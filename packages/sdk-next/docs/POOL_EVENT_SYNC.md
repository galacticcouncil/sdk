# Pool Event-Driven Sync (SOR block consistency, v3)

**Status:** design accepted, not yet implemented.
**Supersedes the sync mechanism in:** `SOR_BLOCK_CONSISTENCY.md` (v1, trigger + pinned read) and `SOR_BLOCK_CONSISTENCY_V2.md` (delta-payload `coupled`).
**Owner:** pool sync.
**Repro:** `chopsticks/src/omni-tear.spec.ts` (red test that pins the bug).

---

## 1. Problem

The SDK keeps AMM pool state (`packages/sdk-next/src/pool/*`) live via multiple
independent storage subscriptions. On an omnipool **add-liquidity**, two coupled
things move in the same block:

- `Omnipool.Assets[asset]` → `hub_reserve` / `shares` (pool **state**)
- the pool account's token balance (pool **reserve**)

Because each is a **separate** `watchEntries` subscription and they are delivered
at different wall-clock instants (measured 0.5–2 s skew on a busy prefix, see
`SOR_BLOCK_CONSISTENCY_V2.md`), the store briefly holds `hub_reserve@N` +
`balance@N-1` — a **torn snapshot** whose implied price (`hub_reserve / reserve`)
is wrong until the lagging half lands.

### Incident

> Someone added 16,700 aDOT to the Omnipool (~0.9% supply increase). sdk-next
> reported a ~0.9% inflated price for ~20 blocks, then it recovered.
> Range #12514444–#12514464, exactly ~20 blocks / 2 min.

### Reproduced

`chopsticks/src/omni-tear.spec.ts` forks Hydration, injects the coupled
add-liquidity effect (bump `Omnipool.Assets` **and** the pool reserve +1% in one
block via `dev.setStorage`), and watches the live `OmniPoolClient`:

```
baseline        bal=60711135190440059  hub=38229896098148721  ratio=0.6297015527
+7 (tear)       bal=60711135190440059  hub=38612195059130208  ratio=0.6359985683   (+1.000%)
+8 (recovered)  bal=61318246542344459  hub=38612195059130208  ratio=0.6297015527
```

`hub_reserve` was applied one block **before** the balance → a +1.0% distortion
for the gap. Cause confirmed: **state and balance are not committed atomically.**

---

## 2. Root cause

N independent storage subscriptions have **no cross-sub delivery ordering**, so a
coupled multi-storage change is observed as several deltas arriving at different
times. Any consumer reading in that window sees a mix of two blocks.

v1/v2 mitigated by re-reading the counterpart at the changed block. This works
but keeps N subscriptions, per-prefix merkle diffs every block, and per-source
monotonic guards — complex, and still one subscription per storage concern.

---

## 3. Chosen design — one event stream drives everything

Subscribe to **`System.Events` once** and drive all AMM sync from the semantic
events in each block. Rationale:

- **Coherent by construction.** `System.Events` is a *single* storage item read
  *once* per block. Everything in that read belongs to the same block — there is
  no cross-subscription skew, so the tear cannot happen.
- **Single source of truth**, upstream-authoritative (same idea as the
  `galacticcouncil/snakewatch` monitor, but here it drives state, not metrics).
- **Fewer subscriptions**, less code, targeted work: an event names *which pool /
  asset* changed and *what kind* of change, so we recompute only the affected
  **slice** — not a full pool resync.

### Shape

```
System.Events (1 sub)
   │  per block: [events...]  ← atomic, all same block
   ▼
event bus  ──►  omnipoolHandler(events)      ─┐
           ──►  stableswapHandler(events)    ─┤ each handler maps event → slice patch
           ...                                │
           ▼                                  ▼
   pinned read at the event's block  →  field-level PoolPatch  →  monotonic store merge

oracle subs (EmaOracle / ManagedOracle / DIA)  ──►  peg-target caches
gated per-block tick  ──►  amp-ramp + peg convergence (only while active)
```

Handler DSL:

```ts
omnipoolHandler(events) {
  events
    .on('Omnipool', 'SellExecuted',  sellHandler)      // → Broadcast.Swapped (see §7)
    .on('Omnipool', 'BuyExecuted',   buyHandler)
    .on('Omnipool', 'LiquidityAdded',   liquidityAddedHandler)
    .on('Omnipool', 'LiquidityRemoved', liquidityRemovedHandler);
}
```

### Coherence rule

1. An event fires → it names the pool + asset(s) + kind.
2. Resolve the affected slice **pinned at the event's block** (`block.hash`), or
   apply the event's amounts directly. Either way the patch is single-block.
3. Commit a field-level `PoolPatch` (see `PoolSync.ts` `commit`) — monotonic
   per-token/per-field merge, block-stamped. A slice that didn't change keeps its
   value; nothing tears because every patch is one block.

---

## 4. Event → slice handler map

Only slices that a given event can move are recomputed. `read` = pinned chain
read; `compute` = pure (params/oracle-cache + block), no read.

### Omnipool (`OmniPoolClient`)

| event | slice | how |
|---|---|---|
| `SellExecuted` / `BuyExecuted` *(deprecated → `Broadcast.Swapped`)* | reserves + state of `asset_in`, `asset_out` | read |
| `LiquidityAdded` / `LiquidityRemoved` | reserves + state of that asset | read |
| `ProtocolLiquidityRemoved`, `AssetRefunded` | reserves + state of that asset | read |
| `TokenAdded` / `TokenRemoved` | **structural** — add/remove pool token | reseed token |
| `TradableStateUpdated` | `tradable` | field patch |
| `AssetWeightCapUpdated` | `cap` | field patch |
| `SlipFeeSet` | fee cache (`maxSlipFee`) | fee input (used by `getPoolFees`) |
| `PositionCreated` / `PositionDestroyed` / `PositionUpdated` | — | **ignore** — per-user LP NFTs, pool aggregate already covered by `Liquidity*` |

### Stableswap (`StableSwapClient`)

| event | slice | how |
|---|---|---|
| `SellExecuted` / `BuyExecuted` *(→ `Broadcast.Swapped`)* | reserves of in/out (issuance unchanged) | read |
| `LiquidityAdded` / `LiquidityRemoved` | reserves + `totalIssuance` | read |
| `AmplificationChanging` | amp-ramp params (`initial/final/initial_block/final_block`) | store params → gated tick (§5) |
| `PoolPegSourceUpdated`, `PoolMaxPegUpdateUpdated` | peg config | refresh source/rate |
| `FeeUpdated` | `fee` | field patch |
| `TradableStateUpdated` | `tradable` | field patch |
| `PoolCreated` / `PoolDestroyed` | **structural** — add/remove pool | reseed/drop |

### Oracle inputs (peg targets — not pool events; the "sub oracle data")

| source | updates |
|---|---|
| `EmaOracle` oracle updates | peg-target cache (`emaOracles`) |
| `ManagedOracle.PriceUpdated` (EVM log) | MM oracle cache (`mmOracles`) |
| `DIA.OracleUpdate` (EVM log) | DIA oracle cache |

No reserve/balance read for any oracle event — they only touch caches.

---

## 5. Time-driven tail — the one thing events can't cover

Some fields drift **between** events with no triggering event:

- **Amplification** interpolates every block between `initial_block…final_block`
  (see `StableSwapClient.getPoolAmplification`).
- **Pegs** converge toward the target at `max_peg_update` per block (see
  `getPoolPegs` → `StableMath.recalculatePegs`), so they keep moving on blocks
  with no new oracle update.

Handle with a **gated per-block tick**: recompute `amplification` / `pegs` only
for pools currently *ramping* (`block < final_block`) or *not yet converged*. The
event set tells you when a window opens (`AmplificationChanging`, oracle update)
and the params tell you when it closes. Outside those windows → no tick, no work.

This replaces today's blanket "recompute amp+pegs for every pool every block"
(`StableSwapClient.subscribeBlock`) with "only the handful currently in motion".

---

## 6. Commit / merge model (unchanged, reuse)

Each handler emits a `PoolPatch<T>` (`src/pool/PoolSync.ts`):

- `tokens: Map<id, Partial<Token>>` for per-token slices (balance, hub_reserve…),
- `fields: Partial<...>` for pool-level slices (`totalIssuance`, `amplification`,
  `pegs`, `fee`).

`commit()` merges field-level, monotonic by block stamp — a stale/late patch can
never regress a field committed at a newer block. This already exists and is the
right substrate; the change is *what produces the patches* (events, not N subs).

---

## 7. Prefer `pallet_broadcast::Swapped` for trades

`Omnipool`/`Stableswap` `SellExecuted`/`BuyExecuted` are **deprecated aliases** of
the unified `pallet_broadcast::Swapped` event. One `Broadcast.Swapped` handler
covers omnipool + stableswap + xyk + lbp trades, keyed by the pool/asset in its
payload. Liquidity has **no** unified event, so `Liquidity*` stay per-pallet.

Decision for implementer: key trades off `Broadcast.Swapped` (future-proof), keep
per-pallet events for liquidity + config + structural.

---

## 8. Completeness & backstops

- **Reserves/issuance are fully event-covered** by trade + liquidity events. Direct
  transfers to a pool account are not a concern (rare, and omnipool prices off
  tracked `hub_reserve`/`shares`, not raw balance).
- **Structural events** (`TokenAdded/Removed`, `PoolCreated/Destroyed`) change pool
  composition — handle as add/remove of a pool/token unit (reseed that unit), not a
  field patch.
- **Backstop:** keep the existing periodic watchdog resync (`PoolClient`) as a
  safety net for any missed-event staleness (full re-seed on interval / gap /
  reconnect). Cheap insurance; the event path is the fast path.

---

## 9. Open items for the implementer

1. **Decode event payload field names** from papi metadata — the descriptors
   anonymize them (`Anonymize<I…>`), grep won't crack them. Needed: which field
   identifies pool/asset per event, esp. `Broadcast.Swapped` (`filler`,
   `inputs[]`, `outputs[]`, asset ids). Write a small script against
   `packages/descriptors/.papi` metadata (or `getTypedApi` event decoders).
2. **Verify omnipool `on_initialize` / hook paths** (LRNA imbalance, protocol fee
   accrual, circuit breaker) either emit a tracked event or can't move *priced*
   state (`hub_reserve`). If they can and don't emit → rely on the periodic resync.
3. **Confirm the oracle update signal**: does `EmaOracle` emit a per-update event,
   or must peg targets still come from a `watchEntries` on `EmaOracle.Oracles`
   (current approach)? MM/DIA already come via EVM logs.
4. **Event-bus API**: implement `on(pallet, event, handler)` / `onFilter(...)` over
   the single `System.Events` stream, delivering per-block batches.
5. **Gating logic** for the amp/peg tick (open/close windows from events + params).
6. **Structural handling**: add/remove pool or token on Token*/Pool* events.

---

## 10. Verification

Red test: `chopsticks/src/omni-tear.spec.ts` (fork via `chopsticks/src/lib`
`spawn(configs.hydration)` — catfish endpoint, Manual block mode). It injects the
coupled add-liq and asserts `distorted blocks === 0`. Currently **fails** (1
distorted block, +1.0%). The event-driven sync must turn it **green**.

Run: `cd chopsticks && npm run spec:omni` (drop `--silent` to see per-block rows).
Pin the tracked asset to real aDOT once its id is known (discovery currently falls
back to `#1000771`).

Known test artifacts (not bugs in the design):
- ~N-block delay before the injected change appears = Chopsticks lazy-fetch over
  the fork, not real-chain behavior.
- `TypeError … reading 'hash'` at teardown = fork closed while a `watchEntries`
  sub is in flight; fix by unsubscribing + settling before `fork.close()`.

---

## 11. References

- `packages/sdk-next/docs/SOR_BLOCK_CONSISTENCY.md`, `…_V2.md` — prior mechanisms.
- `packages/sdk-next/src/pool/PoolSync.ts` — `PoolPatch` / `commit` (reuse).
- `packages/sdk-next/src/pool/{omni,stable}/*Client.ts` — targets.
- `github.com/galacticcouncil/snakewatch` — prior art (single upstream event
  source; monitoring, not state — filters there are NOT for sync).
