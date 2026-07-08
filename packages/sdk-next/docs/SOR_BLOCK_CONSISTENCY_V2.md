# Pool Sync — Reviewed Block-Consistency Proposal

> **Package:** `sdk-next` | **Date:** 2026-07-08
> **Scope:** `src/pool/*`, `src/client/BalanceClient.ts`, `src/utils/QueryBus.ts`, `src/sor/TradeRouter.ts`
> **Related:** [SOR_BLOCK_CONSISTENCY.md](SOR_BLOCK_CONSISTENCY.md), [SOR_AUDIT.md](SOR_AUDIT.md), [SOR_SPEC.md](SOR_SPEC.md)

---

## 0. TL;DR

The original memo is directionally correct: the live pool store can expose mixed-block
state because multiple subscriptions patch the same pool independently.

The main gaps are:

1. it understates the cost of the recommended fix,
2. it assumes more state is block-pinnable than the code actually allows,
3. it misses a separate balance batching bug that can drop updates entirely,
4. it does not tie `getPoolFees()` to the same snapshot as `getPools()`.

My recommendation is a narrower but harder guarantee:

- **Guarantee strict same-block coherence only for pool state that is actually readable
  at a concrete chain hash.**
- **Move high-risk pools from per-field patching to pool-level refresh-at-hash.**
- **Fix the balance batching pipeline first.**
- **Keep EVM / external-oracle derived fields explicitly best-effort until there is a
  block-addressable read path for them.**

That gets Omni / Stable core math onto solid ground without pretending HSM / MM-oracle
state is already snapshot-safe.

---

## 1. What The Original Memo Gets Right

### 1.1 Torn reads are real

[`PoolStore.update()`](../src/pool/PoolStore.ts) serializes writes, but every writer
still commits independently. That avoids write races, not mixed snapshots.

The risk is real in at least these paths:

- [`PoolClient.subscribeBalances()`](../src/pool/PoolClient.ts)
- [`OmniPoolClient.subscribeAssets()`](../src/pool/omni/OmniPoolClient.ts)
- [`StableSwapClient.subscribeIssuance()`](../src/pool/stable/StableSwapClient.ts)
- [`StableSwapClient.subscribeBlock()`](../src/pool/stable/StableSwapClient.ts)
- [`LbpPoolClient.subscribeValidationData()`](../src/pool/lbp/LbpPoolClient.ts)
- [`HsmPoolClient.subscribeCollateralBalance()`](../src/pool/hsm/HsmPoolClient.ts)

### 1.2 `watchValue` / `watchEntries` do carry block info

The memo is correct that the storage watchers already expose `block.hash` /
`block.number`. The current code often discards it immediately.

That makes block-pinned refresh feasible for Substrate-backed pool state.

### 1.3 Seed reads are currently unpinned

`loadPools()` implementations do many parallel `getValue({ at: this.at })` calls with
`this.at === 'best'` in live mode. That can produce a mixed seed if the best block moves
mid-load.

---

## 2. Gaps In The Original Memo

### 2.1 The memo contradicts itself on RPC cost

Early sections say the fix needs "no extra RPC". The recommended fix later is
"trigger, then pinned read", which **does** add extra reads per changed pool per block.

That is not a reason to reject the fix. It just needs to be stated plainly, because
latency and RPC volume are real trade-offs here.

### 2.2 Not all live inputs are block-pinnable today

The memo treats all important inputs as if they can be reread at `block.hash`. That is
not true in the current codebase.

- Stable pegs can depend on [`MmOracleClient.getData()`](../src/oracle/MmOracleClient.ts),
  which calls EVM `latestRoundData` and `getBlock()` at current client state, not at a
  specific Substrate hash.
- HSM mint capacity comes from
  [`GhoTokenClient.getFacilitatorCapacity()`](../src/gho/GhoTokenClient.ts), which is
  also a latest EVM read.
- Omni / Stable fee-oracle data is routed through
  [`QueryBus.scope()`](../src/utils/QueryBus.ts), whose `live` map is keyed only by
  logical key, not by block. Once live data exists, `get()` returns "latest", even if
  the caller wants an older snapshot.
- [`Watcher.bestBlock$`](../src/api/Watcher.ts) currently maps the block watcher down to
  a plain number. Any code driven off that stream has already lost `block.hash`, so it
  cannot do a pinned reread without changing the watcher shape or switching to a direct
  storage/event trigger.

So "pin everything to the snapshot block" is not an incremental refactor. For several
inputs, the read path itself must change first.

### 2.3 The balance pipeline has a separate data-loss bug

[`PoolClient.subscribeBalances()`](../src/pool/PoolClient.ts) does:

```ts
bufferTime(250)
map((batch) => new Map(batch))
```

`batch` is an array of `[address, deltas]`. If the same address emits twice inside the
250 ms window, `new Map(batch)` keeps only the last one.

That is worse than a torn read. It can drop earlier deltas from the same address in the
same buffer window.

This is especially relevant because the code already combines:

- token balances,
- system balances,
- ERC-20 balances,
- and consecutive updates from the same pool.

Any redesign that ignores this bug is incomplete.

### 2.4 Fee reads are outside the snapshot boundary

[`TradeRouter.toSellSwaps()`](../src/sor/TradeRouter.ts) builds `poolPair` from the pool
snapshot, then calls `ctx.getPoolFees(poolPair, pool)` as a second step.

That means even if pool reserves become block-consistent, quotes can still mix:

- pool state from snapshot `N`,
- fee state from a later client cache entry,
- and, for Omni, a plain `this.block` number updated by a separate block watcher.

The memo mentions this only as hardening. It is part of quote correctness.

### 2.5 Adding `syncedAt` directly to `PoolBase` is not a free change

[`PoolBase`](../src/pool/types.ts) is public surface area. Adding required sync metadata
there leaks internal transport details into every consumer and every snapshot fixture.

The design should prefer an internal metadata map first, then expose public fields only
if there is a clear consumer need.

### 2.6 The proposed tests do not match the proposed fix

The original test plan says "no emission until both writers land". That matches a
barrier design.

The recommended fix is not a barrier. It is "any trigger -> reread coherent state at
hash -> commit once". Under that design, a late sibling stream for the same block should
usually be ignored, not awaited.

---

## 3. Revised Design

### 3.1 Scope the guarantee correctly

There should be two classes of live state:

| Class | Guarantee | Examples |
|------|-----------|----------|
| **Pinnable** | All fields in one committed pool snapshot come from one concrete chain hash | Omni reserves, Stable reserves, Stable issuance, LBP balances/weights |
| **Non-pinnable (today)** | Best-effort latest value, explicitly outside strict block guarantee | MM oracle reads, GHO facilitator capacity, any `QueryBus.live` value without block identity |

The first pass should solve the Pinnable class well instead of claiming global
block-consistency for everything.

### 3.2 Fix the balance pipeline before anything else

The current batching code must merge deltas per address, not overwrite them.

Conceptually:

```ts
type BalanceBatch = Map<string, Map<number, AssetBalance>>;

for (const [address, deltas] of batch) {
  const byAsset = acc.get(address) ?? new Map<number, AssetBalance>();
  for (const delta of deltas) byAsset.set(delta.id, delta);
  acc.set(address, byAsset);
}
```

Then convert back to `Map<string, AssetBalance[]>` for `updateBalances`.

This fix is independent of the larger snapshot redesign and should land first.

### 3.3 Replace per-field patching with pool-level refresh for high-risk pools

For pools whose math depends on data from multiple storage items, the update model should
be:

1. subscriptions act only as **change detectors**,
2. the detector identifies the affected pool(s) and carries `block.hash`,
3. the client does a **pool-level refresh at that hash**,
4. the store commits the rebuilt pool object once.

Pseudo-shape:

```ts
type SnapshotMeta = { number: number; hash: string };

protected abstract refreshPoolsAt(
  block: SnapshotMeta,
  changed: ReadonlySet<string>
): Promise<T[]>;
```

Key point: do **not** try to make the existing per-field patch writers mutually aware.
That keeps the fragile part of the design alive.

### 3.4 Keep snapshot metadata internal first

Do not add `syncedAt` to [`PoolBase`](../src/pool/types.ts) in the first pass.

Instead, keep an internal map in each client:

```ts
private snapshotMeta = new Map<string, SnapshotMeta>();
```

On each coherent commit:

- update the pool object,
- store `{ hash, number }` by address,
- make `getPoolFees(pair, address)` use that metadata.

This keeps the public pool type stable while still letting fee logic bind to the same
snapshot.

### 3.5 Snapshot-sensitive reads must bypass current `QueryBus.live`

For any block-sensitive path, `QueryBus.get()` is not enough because `live` is not block
aware.

For the first pass:

- keep `QueryBus` for "latest" convenience reads,
- bypass it inside snapshot refresh paths,
- add a separate block-scoped cache later only if profiling says it is needed.

This is simpler and safer than trying to retrofit block semantics into the existing live
cache immediately.

### 3.6 Pin the seed with a shared helper

Add one helper on the live client side that resolves a concrete hash once per seed:

- historical hash: use it directly,
- `finalized`: resolve finalized hash once,
- `best`: resolve best hash once.

Every `loadPools()` should use that concrete hash for all reads in the seed cycle.

---

## 4. Pool-Specific Plan

### 4.1 Omnipool — do first

This is the clearest correctness bug.

Use any of these as triggers:

- `Omnipool.Assets.watchEntries`
- base balance changes for the omnipool account

On trigger, reread at `block.hash`:

- `Omnipool.Assets`
- all required balances for the omnipool account
- any other strictly math-required storage fields

Commit the rebuilt pool once.

**Important:** Omni fees are still not fully fixed unless
[`OmniPoolClient.getPoolFees()`](../src/pool/omni/OmniPoolClient.ts) reads against the
same snapshot metadata instead of mixing in independently-updated `this.block` and
`QueryBus.live` values.

### 4.2 StableSwap — split core state from oracle-derived state

Core math state should become snapshot-safe first:

- pool reserves,
- `totalIssuance`,
- amplification as of the snapshot block.

Amplification is deterministic from pool config + block number, so compute it using the
snapshot block number, not a later watcher tick.

Pegs need to be split:

- if the source is block-pinnable, include it in the strict snapshot path,
- if the source is MM/EVM-derived, keep it best-effort until there is an addressable
  historical read path.

That is less ambitious than the original memo, but it matches the current code.

### 4.3 LBP — good candidate for full snapshot refresh

LBP already has a useful shape in
[`LbpPoolClient.getPoolDelta()`](../src/pool/lbp/LbpPoolClient.ts): one function reads
balances, weights, and repay-fee state together.

Refactor that function to accept `at: block.hash` and use it as the canonical refresh
path.

### 4.4 HSM — only partial strictness is realistic today

HSM inherits Stable state, but it also depends on:

- facilitator collateral balances,
- GHO facilitator capacity from EVM.

Collateral balances are pinnable. Facilitator capacity currently is not.

So the honest first-pass guarantee is:

- Stable-derived state is coherent at one chain hash,
- collateral balances can join that guarantee,
- `hsmMintCapacity` remains best-effort until there is a historical runtime query or a
  pinned EVM read path.

### 4.5 XYK — keep it simple after the batch fix

For token/token XYK pools, the underlying storage source is already much cleaner than the
cross-pallet pools.

After fixing the balance batching bug, it is reasonable to keep XYK on the delta path
unless native / ERC-20 mixed legs show measurable quote divergence in practice.

### 4.6 Aave — leave alone

[`AavePoolClient`](../src/pool/aave/AavePoolClient.ts) already follows the right shape:
trigger, reread coherent state, commit once.

It is the reference pattern for the pinnable subset.

---

## 5. Rollout Order

1. **Fix `subscribeBalances()` batch merging.**
2. **Pin all seeds to one concrete hash.**
3. **Move Omnipool to pool-level refresh-at-hash.**
4. **Move Stable core state to refresh-at-hash.**
5. **Move LBP to refresh-at-hash.**
6. **Make `getPoolFees()` snapshot-aware for pools that need it.**
7. **Revisit HSM / MM-oracle strictness only after the read paths support it.**

This order fixes the highest-value failures first and avoids a large speculative rewrite.

---

## 6. Test Plan

### 6.1 Balance batching regression

Drive [`PoolClient.subscribeBalances()`](../src/pool/PoolClient.ts) with two deltas for
the same address inside one `bufferTime(250)` window and assert both survive.

### 6.2 Omnipool coherence

Simulate:

- `Omnipool.Assets@N`,
- balance change for the same pool at `N`,
- arbitrary arrival order.

Assert the store commits exactly one rebuilt snapshot for that pool at `N`, and never
publishes `assets@N + balances@N-1`.

### 6.3 Stable reserve / issuance coherence

Replay add/remove-liquidity style updates where reserves and issuance move in the same
block. Assert the committed pool has one snapshot hash for both.

### 6.4 Fee binding

Assert that `getPools()` and `getPoolFees()` for one quoted pool use the same stored
snapshot metadata, not the latest watcher tick.

### 6.5 Honest coverage for non-pinnable state

For HSM / MM-oracle dependent fields, add tests that document current best-effort
semantics instead of pretending they are snapshot-strong already.

---

## 7. Bottom Line

The original memo correctly identifies the mixed-block write model, but its proposed
end-state is broader than the current code can safely deliver.

The better near-term solution is:

- fix the balance batching bug,
- stop patching high-risk pools field-by-field,
- rebuild those pools at a concrete hash,
- and bind fee reads to the same snapshot metadata.

That gives a defensible guarantee for the data that actually drives routing math, without
over-claiming consistency for EVM/oracle paths that are still "latest only".
