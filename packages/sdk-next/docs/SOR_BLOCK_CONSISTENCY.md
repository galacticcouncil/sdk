# Pool Sync — Cross-Block Torn Reads & Block-Consistency Fixes

> **Package:** `sdk-next` | **Date:** 2026-07-08
> **Scope:** `src/pool/*Client.ts`, `src/pool/PoolStore.ts`, `src/pool/PoolClient.ts`, `src/client/BalanceClient.ts`, all `${PoolType}Pool.ts` math entrypoints
> **Related:** [SOR_AUDIT.md](SOR_AUDIT.md), [SOR_SPEC.md](SOR_SPEC.md)

---

## 0. TL;DR

Each pool snapshot in `PoolStore` is patched **field-by-field by several independent
subscriptions**, each of which observes a *different* storage stream with its own
timing and buffering. Nothing ties those writes to a common block. When an on-chain
event changes two coupled fields in the **same block** (e.g. an Omnipool LP add
changes both a token `balance` **and** its `hub_reserve`/`shares`), the two updates
reach the store as **two separate `store.update()` calls**. Between them — a window of
up to one block plus the 250 ms balance buffer — the store holds a **torn read**:
some fields at block `N`, others at block `N-1`.

The router reads that snapshot synchronously
([`OmniPool.parsePair`](../src/pool/omni/OmniPool.ts#L78)) and feeds it straight into
the WASM math ([`calculateOutGivenIn`](../src/pool/omni/OmniPool.ts#L232)). A torn
snapshot ⇒ **incorrect spot price / trade output** for that window.

**Key enabler for the fix:** every papi `watchValue` / `watchEntries` emission
**already carries `block: BlockInfo` (`{ hash, number, parent }`)** — the clients
currently discard it (`map(({ value }) => value)`, `({ value: { deltas } }) => …`).
Storage reads also accept `{ at: <blockHash> }`. So block-coherent commits require
**no new subscriptions and no extra RPC** — only threading the block number that is
already in hand.

**Recommendation:** coalesce all same-block writes into a **single atomic
`store.update()` per block** (Fix A). Keep the delta streams; add a per-client
block barrier keyed on the `block.number` already present in each emission.

---

## 1. How data flows today

### 1.1 Write model — per-field patching, no block coherence

[`PoolStore.update()`](../src/pool/PoolStore.ts#L35) serializes patches through a
promise queue and calls `store$.next()` after **each** patch:

```ts
update(patch) {
  this.updateQueue = this.updateQueue.then(async () => {
    const prev = this.store$.value;
    const updates = await patch(prev);      // one subscription's partial view
    const next = prev.slice();
    for (const u of updates) next[index.get(u.address)] = u;  // spreads ...pool
    this.store$.next(next);                  // <-- emits after EVERY patch
  }).catch(console.error);
}
```

The serialization prevents *lost updates / races* — but it does **not** prevent torn
reads. Two subscriptions that both fire for block `N` produce two sequential
`store.update()` calls and therefore **two emissions**; the first emission exposes a
snapshot where that subscription's fields are at `N` while the other's are still at
`N-1`.

Each subscription's patch does `{ ...pool, <its fields> }`, so a pool object is a
**merge of the most-recent write from each subscription** — every field carries
whatever block *that particular stream* last saw. There is no per-object block stamp.

### 1.2 Read model — consumer sees whatever is currently in the store

[`PoolContextProvider.subscribe()`](../src/pool/PoolContextProvider.ts#L85) writes
every emitted pool into a live map; [`getPools()`](../src/pool/PoolContextProvider.ts#L156)
returns `Array.from(this.pools.values())`. A `getSell/getBuy/getSpotPrice` call landing
between the two emissions of §1.1 reads the torn intermediate. The
[`throttleTime(1_000)`](../src/pool/PoolClient.ts#L115) on `getSubscriber()` is
wall-clock, not block-aligned — it can (and does) forward a torn intermediate.

### 1.3 The extra widener — balances are buffered 250 ms and split across streams

[`PoolClient.subscribeBalances()`](../src/pool/PoolClient.ts#L189) `combineLatest`s up
to three *separate* balance streams per pool — `watchTokensBalance` (`Tokens.Accounts`),
`watchSystemBalance` (`System.Account`), `watchErc20Balance` — then
[`bufferTime(250)`](../src/pool/PoolClient.ts#L221). So:

- `balance` is committed on a **different tick** than every non-balance field
  (assets/issuance/weights/pegs), guaranteeing a tear whenever both change in a block.
- Within balances, a native or ERC-20 leg is a **separate stream** from the token leg;
  a trade that moves both legs in block `N` can be captured as `{tokenLeg@N, nativeLeg@N-1}`.
- [`watchErc20Balance`](../src/client/BalanceClient.ts#L184) re-fetches via
  `bestBlock$.pipe(switchMap(() => getBalanceData(..., { at:'best' })))` — the read
  resolves at *whatever best is when the RPC runs*, not the block that triggered it.

---

## 2. Root cause

> **A single pool's math inputs are sourced from N independent subscriptions, and the
> store commits each one separately. There is no mechanism that guarantees the fields
> entering the math for one pool all come from the same block.**

This is intra-pool, intra-client — it reproduces with a **single** `PoolClient`
instance (as observed). Cross-pool skew (different pools at different blocks) is a
secondary concern; the math is per-pool, so the damaging case is a torn **single-pool**
snapshot.

---

## 3. Catalog of affected pools

| Pool | Math inputs | Writers (independent subscriptions) | Same-block coupling | Severity |
|------|-------------|-------------------------------------|---------------------|----------|
| **Omni** | `balance`, `hubReserves`, `shares`, `protocolShares`, `cap` | balances (base, +250 ms) **vs** `subscribeAssets` | every trade/LP moves `balance` **and** `hub_reserve`/`shares` | **High** |
| **Stable** | reserves, `totalIssuance`, `amplification`, `pegs` | balances (base, +250 ms) **vs** `subscribeIssuance` **vs** `subscribeBlock` | add/remove-liq & all share math couple reserves ↔ `totalIssuance` | **High** |
| **HSM** | stable fields + `collateralBalance` + `hsmMintCapacity` | mirrors Stable **vs** `subscribeCollateralBalance` **vs** `subscribeEvmLog` | inherits Stable + 2 more streams | **High (composite)** |
| **LBP** | `balance`, `weight`, `repayFeeApply` | balances (base) **vs** `subscribeValidationData` | balance (trade) vs weight (relay block) | **Medium** |
| **XYK** | `balanceIn`, `balanceOut` | balances (base) only | token/token = atomic ✅; native/erc20 leg can tear | **Low / Medium** |
| **Aave** | `balance` (liq in/out) | single atomic runtime read ✅ | — | **None (reference)** |

### 3.1 Omnipool — High

[`OmniPoolClient.subscribeAssets()`](../src/pool/omni/OmniPoolClient.ts#L323) writes
`hubReserves/shares/protocolShares/cap/tradeable` from `Omnipool.Assets.watchEntries`.
`balance` comes from the base balance subscription. These are two streams and two
commits. `calculateOutGivenIn` mixes both
([OmniPool.ts:241](../src/pool/omni/OmniPool.ts#L241)) — the exact case reported:
*state updated (hub_reserve/shares), balance not yet → wrong output.* Fees add a third
timing source (`this.block` from
[`subscribeBlock`](../src/pool/omni/OmniPoolClient.ts#L315)) but affect fee accuracy
only, not reserves.

### 3.2 Stableswap — High

Reserves ← base balances (+250 ms). `totalIssuance` **and** the share token's balance
← [`subscribeIssuance`](../src/pool/stable/StableSwapClient.ts#L342) (immediate).
`amplification`/`pegs` ← [`subscribeBlock`](../src/pool/stable/StableSwapClient.ts#L486)
(recomputed each `bestBlock$` from static `poolsData` + cached oracles). The share-based
paths ([`calculateShares`](../src/pool/stable/StableSwap.ts#L297),
[`calculateWithdrawOneAsset`](../src/pool/stable/StableSwap.ts#L279),
[`calculateAddOneAsset`](../src/pool/stable/StableSwap.ts#L188)) read `getReserves()`
(balances) **and** `totalIssuance` — different streams, so add/remove-liquidity tears
them. Plain swaps tear reserves vs `amplification`/`pegs`.

### 3.3 HSM — High (composite)

[`subscribeStableswapUpdates`](../src/pool/hsm/HsmPoolClient.ts#L260) copies the
Stableswap snapshot (inheriting its tear), while `collateralBalance`
([`subscribeCollateralBalance`](../src/pool/hsm/HsmPoolClient.ts#L198)) and
`hsmMintCapacity` ([`subscribeEvmLog`](../src/pool/hsm/HsmPoolClient.ts#L159)) arrive on
two further independent streams — a three-way skew on top of Stable's.

### 3.4 LBP — Medium

`weight`/`repayFeeApply` ←
[`subscribeValidationData`](../src/pool/lbp/LbpPoolClient.ts#L206) (relay block);
`balance` ← base balances. Weights are a slow deterministic ramp, so a one-block skew
is a small pricing error except near ramp boundaries — but it is a genuine torn read.

### 3.5 XYK — Low / Medium

[`subscribeUpdates()` is `EMPTY`](../src/pool/xyk/XykPoolClient.ts#L106); reserves come
only from base balances. **Token/token pools are atomic** — both deltas arrive in one
`Tokens.Accounts.watchEntries` emission → one commit. **Native- or ERC-20-legged
pools** can tear across the separate balance streams (§1.3).

### 3.6 Aave — the reference pattern ✅

[`getPoolDelta`](../src/pool/aave/AavePoolClient.ts#L95) reads `liquidity_in` **and**
`liquidity_out` in **one** `AaveTradeExecutor.pool()` runtime call and commits both
atomically; base balances are
[disabled](../src/pool/aave/AavePoolClient.ts#L210). Both values are always mutually
consistent. (Minor: the read uses `at:'best'` at call time, so it may reflect a block
slightly ahead of the triggering event — but the two values still agree with *each
other*, which is what the math requires.)

### 3.7 Bonus: the seed read is also not pinned

`loadPools()` issues many parallel `getValue({ at:'best' })` calls (e.g.
[OmniPoolClient.loadPools](../src/pool/omni/OmniPoolClient.ts#L116) reads
`Assets.getEntries`, balances, and `System.Number` in one `Promise.all`). Each resolves
`'best'` independently, so if a block lands mid-load the seed itself can be torn. Same
class of bug, trivially fixed by pinning (§4, Fix D).

---

## 4. Fixes

All options exploit the same enabling fact: **`block.number` / `block.hash` is already
present in every emission**, and reads accept `{ at: hash }`.

> **Design principle (read first).** Block-coherence must come from **atomic delivery**,
> never from *reassembling* independent deliveries by block number. There are exactly two
> sources of atomic delivery: **(1)** a single subscription emission that already carries
> all coupled fields, or **(2)** a pinned read at `block.hash`. When coupled fields span
> pallets (`Omnipool.Assets` + `Tokens.Accounts`; Stable reserves + `TotalIssuance`),
> only (2) is available — so the primary fix for the High-severity pools is
> **Fix B/C**, not Fix A.

### Fix A — Per-block commit barrier ⚠️ *only sound for single-stream coupling*

Keep the delta streams. Stop committing each subscription separately; **buffer all
patches by `block.number` and flush them in one atomic `store.update()` when the block
advances.** The store then never exposes a partial block.

**Step 1 — stop discarding the block.** Each handler already receives it:

```ts
// OmniPoolClient.subscribeAssets — before
.subscribe(({ value: { deltas } }) => { this.store.update(([pool]) => …); });

// after: forward the block that produced the deltas
.subscribe(({ value: { block, deltas } }) =>
  this.commitAt(block.number, ([pool]) => …)   // same patch body
);
```

The base balance path
([`subscribeBalances`](../src/pool/PoolClient.ts#L189)) buffers across streams; buffer
by **block** instead of `bufferTime(250)` so balances commit with that block's state.

**Step 2 — a tiny per-client coalescer** (new helper, ~30 lines):

```ts
private pendingBlock = 0;
private pending: Array<(s: readonly T[]) => T[] | Promise<T[]>> = [];

protected commitAt(block: number, patch) {
  if (block > this.pendingBlock && this.pending.length) this.flush(); // seal prior block
  this.pendingBlock = Math.max(this.pendingBlock, block);
  this.pending.push(patch);
  queueMicrotask(() => this.flush());  // or flush on watcher.bestBlock$ tick
}

private flush() {
  if (!this.pending.length) return;
  const patches = this.pending; this.pending = [];
  this.store.update(async (state) => {           // ONE emission for the whole block
    let acc = state.slice();
    for (const patch of patches) acc = merge(acc, await patch(acc)); // later see earlier
    return acc;
  });
}
```

- **Guarantee:** the store only ever holds a whole block's worth of changes. Fields that
  didn't change that block legitimately keep their last value (they match chain state).
- **Cost:** zero extra RPC (deltas unchanged); one commit per block instead of several;
  bounded ≤1-block latency.
- **Effort:** small — thread `block.number` into ~8 existing `.subscribe` bodies + one
  helper + block-buffer the balance path.
- **Implementation note:** patches currently return full pool objects; `merge` must fold
  each patch onto the evolving `acc` so a later patch (e.g. assets) sees an earlier one
  (e.g. balances) for the same address.

> **⚠️ Completeness flaw — why this is *not* the primary fix.** Coalescing by
> `block.number` is a **barrier waiting on an unknown, variable set of writers**, and its
> two failure modes are indistinguishable at runtime:
>
> - **Flush too early** (microtask fires / block advances before the balance stream has
>   delivered `balance@N`) → you commit `assets@N + balance@N-1`. Still torn.
> - **Wait for the straggler** → but you cannot know whether `balance` even *changed* at
>   `N`. *"No emission because nothing changed"* and *"emission pending because it's
>   late"* look identical. So you either **stall `N` indefinitely** waiting for a delta
>   that will never come, or you time-box the wait and reintroduce the tear.
>
> A barrier cannot be correct when it does not know who is supposed to show up. Fix A is
> therefore sound **only** where all coupled fields for a pool arrive in a *single*
> subscription emission (XYK token/token — one `Tokens.Accounts.watchEntries` emission
> carries both reserves). For cross-pallet coupling (Omni, Stable, HSM, LBP) use Fix B/C,
> where a **single** trigger suffices and the pinned read — not the barrier — supplies
> coherence.

### Fix B — Trigger-then-pinned-read ✅ *recommended (High-severity pools)*

Treat the delta streams as **change triggers only** — ignore *which* half fired. On
**any** trigger for `(pool, block N)` (the emission carries `block.hash`), pin-read the
full coupled set at `at: block.hash` and commit atomically:

```ts
// Omni: any change to this pool at block N → read BOTH coupled sides at hash N
merge(assetsChanged$, balancesChanged$)          // triggers only; payloads unused
  .pipe(dedupeBy(({ block }) => block.hash))     // one read per (pool, block)
  .subscribe(async ({ block }) => {
    const [assets, balances] = await Promise.all([
      this.api.query.Omnipool.Assets.getEntries({ at: block.hash }),
      this.balance.getBalancesAt(addr, ids, { at: block.hash }),
    ]);
    this.store.update(() => build(assets, balances)); // atomic, all fields @ N
  });
```

Why this has none of Fix A's problems:

- **A single trigger is sufficient** — you never wait on a quorum, so a stale/missing
  sibling stream cannot corrupt or block you. Fix A waits for the **slowest/all** writers;
  Fix B fires on the **fastest/any** one.
- **The read — not the streams — supplies coherence.** `getValue({ at: hash_N })` is
  deterministic for `N`, so even a late `balance@N` (papi still tags it with block `N`)
  pins to the same hash. No reassembly.
- **Bounded latency.** ~one block for the trigger + one RPC round-trip; never infinite.
  (You *do* pay one extra RPC of latency vs today's payload-apply — that is the
  irreducible floor for cross-pallet coherence; see the delay note in §4.1.)
- **Staleness → liveness, not consistency.** If a stream dies, the block-gap / periodic
  **watchdog** ([`startWatchdog`](../src/pool/PoolClient.ts#L319)) resyncs — a separate,
  already-existing concern. Consistency is never at the mercy of stream timing.

Cost: a pinned read per changed pool per block. Minimize by reading only the
**counterpart half** of what the trigger already delivered (the delta gives you the
changed `ids` and the block); dedupe by `(pool, block)` so a two-sided change reads once.
This is precisely the Aave pattern ([`getPoolDelta`](../src/pool/aave/AavePoolClient.ts#L95))
generalized to pools whose coupled fields live in more than one storage item.

#### 4.1 The "delayed state" trade-off, stated plainly

Both directions have a delay; they differ in kind:

| | Fix A (barrier) | Fix B (trigger + pinned read) |
|---|---|---|
| Delay source | wait for *all* same-block writers | one RPC after the *first* trigger |
| Worst case | **unbounded** (straggler never emits → stall, or flush early → torn) | **bounded**: ~1 block + 1 RPC |
| On a dead stream | corrupts or stalls state | resync via watchdog; consistency intact |

So yes — Fix B adds a small, *bounded* one-RPC delay before block `N` is visible. That is
strictly better than Fix A, whose "delay" is either an incorrect early commit or an
**unbounded** stall you cannot detect. If even that one-RPC delay is unacceptable for a
hot path, the only way to remove it is atomic single-source delivery — impossible across
pallets — so the RPC is the correctness floor, not a tunable.

### Fix C — Uniform snapshot-per-block ✅ *recommended end-state*

Adopt Aave's model everywhere: subscribe only to "something relevant changed this
block" signals; on trigger, re-read **all** math inputs for the changed pools pinned at
`block.hash` and commit atomically. Simplest mental model and a hard guarantee, but
rewrites every client and raises per-block reads. Note the shape already exists —
[`SnapshotPoolCtxProvider`](../src/pool/SnapshotPoolCtxProvider.ts) consumes a coherent
`{ block, pools, states }` bundle; the live provider could emit the same.

### Fix D — Pin the seed read (do regardless)

In every `loadPools()`, resolve the best hash **once** and pass `at: hash` to all reads
so the seed is coherent:

```ts
const at = this.at === 'best' ? (await this.client.getBestBlocks())[0].hash : this.at;
// … getEntries({ at }), getBalance(…, { at }), System.Number.getValue({ at }) …
```

---

## 5. Complementary hardening (cheap)

1. **Stamp the block on each snapshot.** Add `syncedAt: number` to `PoolBase`, set from
   the committing block. Enables assertions, logging, and lets consumers reject stale /
   mismatched snapshots. Nearly free once Fix A threads the block.
2. **Block-gate `getSubscriber()`.** Replace the wall-clock
   [`throttleTime(1_000)`](../src/pool/PoolClient.ts#L115) with emit-once-per-block after
   the coalescer flush, so consumers never observe a mid-tear intermediate. Automatically
   satisfied once Fix A lands.
3. **Pin fee/peg QueryBus reads to the snapshot block.** Fees/pegs are pulled via
   point reads at `at:'best'` at query time, decoupled from the reserves' block. Once
   snapshots carry `hash`, pass `at: hash` so fees match the reserves they price.
4. **Keep Aave as-is** — it is already correct and validates the atomic-read principle.

---

## 6. Recommendation & priority

| # | Action | Effort | Impact | Risk |
|---|--------|--------|--------|------|
| 1 | **Fix A** — per-block commit barrier (Omni, Stable, HSM, LBP, XYK) | S–M | **Eliminates torn reads, no extra RPC** | Low (merge-fold correctness) |
| 2 | **Fix D** — pin seed reads | S | Removes seed-time tears | None |
| 3 | Hardening #1 (`syncedAt`) + #2 (block-gate) | S | Guarantee + observability | Low |
| 4 | Hardening #3 (pin fee reads) | S | Fees match reserves' block | Low |
| 5 | Fix C — uniform snapshot-per-block | L | Simplest model long-term | Medium (rewrite) |

**Do 1–4 now.** They are additive, need no new subscriptions, and turn the store into a
block-coherent snapshot. Consider Fix C later only if the coalescer merge logic proves
fiddly enough to justify a uniform rewrite.

---

## 7. Testing

- **Unit (deterministic):** drive a `PoolClient` with mocked emissions where the assets
  stream reports block `N` before the balance stream reports `N` (and the reverse). Assert
  the store **never** emits a snapshot mixing `N` and `N-1` for one pool — i.e. no
  emission until both land, then exactly one coherent commit.
- **Property:** for any interleaving of per-stream emissions, every store emission is
  internally block-consistent (all changed fields share one `block.number`).
- **Regression:** replay a real LP-add block for Omni/Stable through a chopsticks fork;
  compare SDK `calculateOutGivenIn` against the runtime router at the same block hash —
  must match with zero torn-window divergence.
- Reuse fixtures in [`test/data/`](../test/data/) and the existing
  `SnapshotPoolCtxProvider` spec harness.
