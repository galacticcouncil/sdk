# Pool Event-Driven Sync — Implementation Guide

Companion to **`POOL_EVENT_SYNC.md`** (read that first for the *why*). This doc is
the *how*: concrete wiring against the current `packages/sdk-next/src/pool/*`
code, with no assumptions about abstractions that were removed.

**Repro / gate:** `chopsticks/src/omni-tear.spec.ts` must go green.

---

## 0. TL;DR

Replace the two racing store-writers (`PoolClient.subscribeBalances` +
`{AMM}Client.subscribeUpdates`) with **one** `System.Events` subscription. Per
block, collect the events, resolve only the slices they touch (pinned at that
block), and apply them in a **single `store.update`**. A single ordered stream +
one commit per block = coherent by construction — **no `PoolPatch`/block-stamp
layer, no re-introduction of `PoolSync`.**

---

## 1. Current architecture (what exists today)

`PoolClient<T>` (`src/pool/PoolClient.ts`):

- `store: PoolStore<T>` — write via `store.update((state: readonly T[]) => T[])`
  (full read-modify-write; returns the pools that changed). No block stamps.
- `getSubscriber()` → `subscribeStore()`: per resync cycle it seeds via
  `loadPools()`, then attaches **two** live writers:
  ```ts
  cycle.add(this.subscribeBalances());   // base: balance watches → store.update
  cycle.add(this.subscribeUpdates());    // abstract: per-AMM state/fees/pegs
  ```
- `subscribeBalances()` (base, concrete): per pool, `combineLatest` of
  `balance.watchTokensBalance/​watchSystemBalance/​watchErc20Balance`, `bufferTime(250)`,
  → `store.update(updateBalances)`.
- `subscribeUpdates()` (abstract): omnipool watches `Omnipool.Assets` + fee/oracle
  caches; stableswap watches pegs/oracles + a pinned reserve/issuance read + a
  per-block amp/peg recompute (`subscribeBlock`).
- Watchdog: `startWatchdog()` resyncs on gap / offline→online / every 60 min.
- `watchGuard(tag)`: stream error → `requestResync(true)`.

**The bug:** `subscribeBalances` (reserve) and `subscribeUpdates` (state) are
**independent** subscriptions writing the store at different times → torn
snapshot on a coupled change (see design doc §1–2).

---

## 2. Target architecture

```
PoolClient.subscribeStore (unchanged lifecycle: seed → attach writers → resync)
   └─ cycle.add(this.subscribeSync())          // ← the ONE writer replacing both
                                                //   subscribeBalances + subscribeUpdates

subscribeSync() wires, per AMM:
   1. events$  = System.Events (1 sub) → per-block decoded batch
                 → dispatch to this AMM's handlers → resolve slices @block
                 → ONE store.update per block   (concatMap keeps blocks ordered)
   2. tick$    = watcher.bestBlock$, GATED → recompute amp/pegs only for pools
                 currently ramping / converging → store.update
   3. oracle$  = existing EmaOracle/MM/DIA subs → update peg-target caches only
```

Removed: `PoolClient.subscribeBalances` (balance-watch path) and the per-AMM
`subscribeUpdates` state/pinned-read paths. Fee/oracle **caches** and the
`getPoolFees` read path stay as-is.

### Why coherent without PoolPatch

- `System.Events` is one storage item; one `watchValue` delivers a block's whole
  event vec **atomically**. No cross-sub skew — the tear's root cause is gone.
- Blocks are processed **in order** via `concatMap`; each block's slices are
  applied in **one** `store.update`. A later block can't be committed before an
  earlier one finishes, so no regression → monotonic without stamps.
- `store.update((state) => T[])` already does read-modify-write of only the
  changed pools/tokens. That is the entire merge. Keep it.

---

## 3. New modules & target layout

Introducing `events/` is the moment to separate **sync infrastructure** from the
**AMM implementations**, which today sit loose directly under `pool/`. Group all
AMMs under one roof (`amm/`):

```
src/pool/
  PoolClient.ts  PoolStore.ts  PoolLog.ts  types.ts     # base / infra
  PoolFactory.ts  PoolContextProvider.ts  index.ts
  events/                      # NEW — event-driven sync infrastructure
    EventBus.ts                #   System.Events → per-block decoded batches
    types.ts                   #   DecodedEvent, PoolEventHandler, PoolMutation
  amm/                         # NEW roof — every AMM implementation
    omni/  stable/  xyk/  lbp/  aave/  hsm/
```

Per-AMM handlers live in each client (`amm/omni/OmniPoolClient`, …) as methods,
registered through the bus.

> **Reorg cost** (do as its own commit, separate from the sync change): `git mv`
> the six AMM dirs under `amm/`, bump their intra-pool relative imports one level
> (`../types` → `../../types`, `../PoolClient` → `../../PoolClient`, etc.), and
> update `pool/index.ts` re-exports (`export * as omni from './omni'` →
> `'./amm/omni'`). No cross-package or jest-resolver changes. Keep public export
> names (`pool.omni`, `pool.stable`, …) identical so consumers are unaffected.

### 3.1 EventBus

One subscription, decoded, grouped per block:

```ts
// papi decodes System.Events into: { phase, event: Enum, topics }[]
//   event.type        → pallet name   ('Omnipool' | 'Stableswap' | 'Broadcast' | …)
//   event.value.type  → event method  ('SellExecuted' | 'LiquidityAdded' | …)
//   event.value.value → payload
export interface DecodedEvent {
  pallet: string;
  method: string;
  data: any;              // typed per (pallet, method) — see §6 decoding
}

export interface BlockEvents {
  block: BlockRef;        // { hash, number } of the emitting block
  events: DecodedEvent[];
}

// in Papi/EventBus:
watchBlockEvents(): Observable<BlockEvents> {
  return this.api.query.System.Events.watchValue({ at: 'best' }).pipe(
    map(({ block, value }) => ({
      block: block as BlockRef,
      events: value.map((r: any) => ({
        pallet: r.event.type,
        method: r.event.value.type,
        data: r.event.value.value,
      })),
    }))
  );
}
```

> Verify the exact `System.Events` decoded shape against this papi version before
> relying on `r.event.type` / `.value.type` (papi enum nesting). A quick console
> log of one emission settles it.

### 3.2 Handler contract

```ts
export interface PoolMutation<T> {
  address: string;
  apply: (pool: T) => T;         // read-modify-write one pool
}

export interface PoolEventHandler<T> {
  match: (e: DecodedEvent) => boolean;
  // resolve the slice(s) this event dirties, PINNED at the event's block
  resolve: (e: DecodedEvent, block: BlockRef) => Promise<PoolMutation<T>[]>;
}
```

### 3.3 The per-block driver (in PoolClient, shared)

```ts
protected subscribeEvents(handlers: PoolEventHandler<T>[]): Subscription {
  return this.eventBus.watchBlockEvents()
    .pipe(
      // resolve all matched slices for the block, pinned @ block.hash
      concatMap(async ({ block, events }) => {
        const matched = events.flatMap((e) =>
          handlers.filter((h) => h.match(e)).map((h) => h.resolve(e, block))
        );
        const muts = (await Promise.all(matched)).flat();
        return { block, muts };
      }),
      filter(({ muts }) => muts.length > 0),
      this.watchGuard('events')
    )
    .subscribe(({ muts }) => {
      this.store.update((state) => applyMutations(state, muts)); // one commit/block
    });
}
```

`applyMutations`: group by address, fold each pool through its mutations’ `apply`,
return only touched pools. (Trivial helper; no stamps.)

`concatMap` (not `mergeMap`) is required — it serializes block processing so
commits stay in block order even though `resolve` awaits reads.

---

## 4. Base `PoolClient` changes

1. **Delete** `subscribeBalances()` and its `updateBalances`/balance-watch wiring
   (the balance path that tore). Balances now arrive via trade/liquidity events.
2. Replace the abstract `subscribeUpdates(): Subscription` with:
   ```ts
   protected abstract syncHandlers(): PoolEventHandler<T>[];
   protected subscribeTick(): Subscription { return Subscription.EMPTY; }   // amp/peg, optional
   protected subscribeOracles(): Subscription { return Subscription.EMPTY; } // caches, optional
   ```
3. In `subscribeStore`, swap the two `cycle.add(...)` for:
   ```ts
   cycle.add(this.subscribeEvents(this.syncHandlers()));
   cycle.add(this.subscribeTick());
   cycle.add(this.subscribeOracles());
   ```
4. Keep the seed (`loadPools`), watchdog, resync, `watchGuard` untouched — they’re
   the completeness backstop.

---

## 5. Per-AMM handlers

### Omnipool (`OmniPoolClient.syncHandlers`)

| match | resolve (pinned @block) |
|---|---|
| `Broadcast.Swapped` where filler = omnipool | read balance + `Omnipool.Assets` for each asset in `inputs`/`outputs` → mutate those tokens |
| `Omnipool.LiquidityAdded` / `LiquidityRemoved` / `ProtocolLiquidityRemoved` / `AssetRefunded` | read balance + `Omnipool.Assets` for that asset |
| `Omnipool.TokenAdded` / `TokenRemoved` | structural — add/remove pool token (reseed that token; or `requestResync()` for v1 simplicity) |
| `Omnipool.TradableStateUpdated` | set `tradeable` from payload (no read) |
| `Omnipool.AssetWeightCapUpdated` | set `cap` (no read) |
| `Omnipool.SlipFeeSet` | update `maxSlipFee` cache (fee input) |
| `Omnipool.Position*` | ignore |

Slice read helper (reuse existing clients):
```ts
async omniToken(id: number, at: string): Promise<Partial<OmniPoolToken>> {
  const [bal, state] = await Promise.all([
    this.balance.getBalanceAt(this.poolAddress, id, at),
    this.api.query.Omnipool.Assets.getValue(id, { at }),
  ]);
  return { balance: bal.transferable, ...mapState(state) };
}
```

### Stableswap (`StableSwapClient.syncHandlers`)

| match | resolve |
|---|---|
| `Broadcast.Swapped` where filler = a stableswap pool | read reserves of in/out for that pool |
| `Stableswap.LiquidityAdded` / `LiquidityRemoved` | read reserves + `Tokens.TotalIssuance` for that pool |
| `Stableswap.AmplificationChanging` | store ramp params → open a tick window (§7) |
| `Stableswap.PoolPegSourceUpdated` / `PoolMaxPegUpdateUpdated` | refresh peg config |
| `Stableswap.FeeUpdated` | set `fee` |
| `Stableswap.TradableStateUpdated` | set `tradable` |
| `Stableswap.PoolCreated` / `PoolDestroyed` | structural — add/remove pool (or `requestResync()`) |

---

## 6. Payload decoding (must do first)

The descriptors anonymize event payloads (`Anonymize<I…>`), so field names aren’t
greppable. Before writing `resolve`s, dump the real shapes:

- Write a throwaway script (pattern: `chopsticks/src/lib` + `getTypedApi`) that
  logs one decoded instance of each event, **especially `Broadcast.Swapped`** —
  confirm how it carries the pool identity (`filler` / `filler_type`?) and the
  asset ids/amounts (`inputs: {asset, amount}[]`, `outputs: {asset, amount}[]`?).
- Confirm `Omnipool.LiquidityAdded` asset field, `Stableswap.*` `pool_id`, and
  `AmplificationChanging` fields (`current/final/start/end` block).

Key on `Broadcast.Swapped` for trades (the per-pallet `Sell/BuyExecuted` are
deprecated aliases). Map `filler` → pool address to route to the right AMM/pool.

---

## 7. Gated amp/peg tick (`subscribeTick`, stableswap only)

Replaces today’s blanket `subscribeBlock`. Maintain a set of "in-motion" pools:

- `AmplificationChanging` → add pool with `endBlock`; drop when `block >= endBlock`.
- peg convergence → mark pool in-motion when an oracle update moves its target;
  drop when `recalculatePegs` output equals target (converged).

```ts
subscribeTick(): Subscription {
  return this.watcher.bestBlock$.pipe(this.watchGuard('tick')).subscribe((n) => {
    const active = this.poolsInMotion(n);           // ramping or not-yet-converged
    if (!active.length) return;                     // gate: no work on quiet blocks
    this.store.update((state) =>
      active.map((id) => recomputeAmpPegs(state, id, n)).filter(Boolean)
    );
  });
}
```

Pure compute (params + block + oracle cache), no chain read.

---

## 8. Oracle caches (`subscribeOracles`, reuse)

Keep the existing `subscribeEmaOracles` / MM / DIA subscriptions — they only write
the peg-target **caches** (`emaOracles`, `mmOracles`). The tick (§7) turns cache
changes into `pegs` field updates for in-motion pools. No store write from oracle
subs directly (except flagging a pool in-motion).

---

## 9. Structural events

`TokenAdded/Removed`, `PoolCreated/Destroyed` change composition. v1: call
`requestResync()` (cheap, correct, rare). v2: targeted add/remove of the
pool/token unit without a full reseed. Start with resync.

---

## 10. Migration / rollout

1. Land `EventBus` + the `subscribeEvents` driver + handler contract in
   `PoolClient` (behind the new abstract `syncHandlers`).
2. Convert **Omnipool** first (it has the repro). Implement `syncHandlers`,
   delete its `subscribeUpdates` state path. Keep fee/oracle caches.
3. Make `chopsticks/src/omni-tear.spec.ts` **green** (fix teardown race; pin aDOT).
4. Convert **Stableswap** (reserves+issuance handlers + gated tick + oracle caches).
5. Convert xyk / lbp / aave / hsm.
6. Remove base `subscribeBalances` once all AMMs are off it.

Do it per-AMM; the base can support old (`subscribeUpdates`) and new
(`syncHandlers`) side by side during migration if needed.

---

## 11. Edge cases / risks

- **Broadcast.Swapped granularity**: may fire once per hop. Fine for sync (each hop
  did move that pool); just don’t apply monitoring filters (`notInRouter` etc.) —
  see design doc §3.
- **on_initialize hooks** (LRNA imbalance, protocol fees) that move `hub_reserve`
  without an event → caught by the 60-min periodic resync; verify against the
  pallet whether any are frequent enough to need explicit handling.
- **Event vs block for the read**: always read at `block.hash` of the event’s
  block, never `'best'` — `'best'` can have advanced past N and reintroduce skew.
- **`resolve` throwing** (e.g. missing oracle) → `watchGuard('events')` forces a
  resync; acceptable.
- **Initial seed still needed**: `loadPools()` stays as the block-0 snapshot;
  events only carry deltas forward from there.

---

## 12. Verification

- `cd chopsticks && npm run spec:omni` (drop `--silent` for per-block rows) →
  `distorted blocks === 0`.
- Add a stableswap variant of the repro (amp ramp + a trade) once stableswap is
  converted.
- Sanity: on a quiet chain the tick does no work (log it), and a normal trade
  updates reserve + state in the **same** committed block (no intermediate torn
  ratio).
