# TradeRouter & Pool Module - Performance & Resilience Audit

> **Package:** `sdk-next` | **Date:** 2026-03-14
> **Scope:** `src/sor/TradeRouter.ts`, `src/sor/Router.ts`, `src/pool/*`
> **Related:** [SOR_SPEC.md](SOR_SPEC.md)

---

## 1. What's Already Well Optimized

1. **Stateless TradeRouter**: No blocking state, pure function over snapshot. Multiple consumers can query concurrently without contention.

2. **Parallel route evaluation**: `Promise.all(paths.map(...))` in `getSell/getBuy` evaluates all routes concurrently.

3. **Memoized pool loading**: `memoize1` + TLRU(6s) prevents redundant chain queries during rapid successive calls.

4. **QueryBus two-tier cache**: Live subscription values avoid RPC round-trips for fees during trade evaluation. The `getPoolFees()` path hits `live` map first (O(1)) before falling through to cached RPC.

5. **Changeset-based delta emissions**: `PoolStore` tracks which pools actually changed, `getSubscriber()` filters unchanged snapshots via `applyChangeset`. Downstream only processes deltas.

6. **Subscription sharing**: `share({ connector: () => new ReplaySubject(1) })` ensures single internal wiring regardless of subscriber count.

7. **Buffered balance updates**: 250ms `bufferTime` batches balance changes, reducing store churn.

8. **Throttled consumer emissions**: 1s `throttleTime` on `getSubscriber()` prevents downstream flooding.

9. **Serialized store updates**: Promise-queue in `PoolStore.update()` prevents race conditions without locks.

10. **Watchdog self-healing**: Auto-resync on connection recovery and block gaps with throttling.

---

## 2. Identified Bottlenecks & Improvement Opportunities

### B1: `PoolFactory.get()` called per-pool on every trade query

**Location:** `Router.toPoolsMap()` (line 227-230) and `Router.validateInput()` -> `getPaths()` chain

**Impact:** Medium. Every `withCtx()` call creates `Pool` value objects for *all* pools, not just those in the matched routes.

**Current cost:** N pool allocations + constructor work per trade query.

**Suggestion:** Cache the `Pool` map keyed on pool address + a generation counter that increments when `PoolStore` changes. The `Pool` objects are pure projections of `PoolBase` data, so they can be safely cached until the underlying data changes.

```typescript
// In Router or PoolContextProvider:
private poolGeneration = 0;
private cachedPoolsMap?: Map<string, Pool>;

private toPoolsMap(pools: PoolBase[]): Map<string, Pool> {
  const gen = this.getGeneration(pools); // e.g. hash of pool count + latest changeset
  if (this.cachedPoolsMap && this.poolGeneration === gen) {
    return this.cachedPoolsMap;
  }
  this.cachedPoolsMap = new Map(pools.map(i => [i.address, PoolFactory.get(i)]));
  this.poolGeneration = gen;
  return this.cachedPoolsMap;
}
```

**Estimated improvement:** Eliminates redundant allocations for sequential queries within the same block. Most impactful for `getSpotPrice()` calls which are high-frequency.

### B2: `getPaths()` calls `toPoolsMap()` separately from `validateInput()`

**Location:** `Router.getPaths()` line 167 and `Router.validateInput()` line 139

**Impact:** Low-Medium. `toPoolsMap()` is called twice: once in `validateInput` and once inside `getPaths()` via `validPath()`.

**Suggestion:** `buildCtxSync` already calls `validateInput` which returns the map. Pass it through to `getPaths` instead of rebuilding:

```typescript
private buildCtxSync(assetIn: number, assetOut: number, pools: PoolBase[]): Ctx {
  const poolsMap = super.validateInput(assetIn, assetOut, pools);
  const paths = super.getPaths(assetIn, assetOut, pools, poolsMap); // pass map
  if (!paths.length) throw new RouteNotFound(assetIn, assetOut);
  return { paths, pools, poolsMap };
}
```

### B3: `getPoolFees()` is async and called sequentially per hop in `toSellSwaps`/`toBuySwaps`

**Location:** `TradeRouter.toSellSwaps()` line 421, `TradeRouter.toBuySwaps()` line 767

**Impact:** Medium-High for multi-hop routes. Each hop awaits `getPoolFees()` before proceeding to the next because the output amount feeds the next input. However, the *fee fetch itself* is independent of amounts.

**Suggestion:** Pre-fetch fees for all hops in a route before the sequential calculation loop:

```typescript
private async toSellSwaps(amountIn, path, poolsMap): Promise<SellSwap[]> {
  // Pre-fetch all fees in parallel
  const feePromises = path.map(hop => {
    const pool = poolsMap.get(hop.poolAddress)!;
    const poolPair = pool.parsePair(hop.assetIn, hop.assetOut);
    return this.ctx.getPoolFees(poolPair, pool);
  });
  const allFees = await Promise.all(feePromises);

  // Now run sequential calculation with pre-fetched fees
  const swaps: SellSwap[] = [];
  for (let i = 0; i < path.length; i++) {
    // ... use allFees[i] instead of await this.ctx.getPoolFees(...)
  }
  return swaps;
}
```

**Estimated improvement:** For a 3-hop route, saves ~2 sequential RPC round-trips (if fees aren't in QueryBus live cache). Even when cached, eliminates unnecessary microtask scheduling.

### B4: `PoolContextProvider.getPools()` creates a new array on every call

**Location:** `PoolContextProvider.getPools()` line 148-161

**Impact:** Low. `Array.from(this.pools.values())` allocates on each call. Given this is called per-trade, it adds GC pressure.

**Suggestion:** Maintain a cached array that invalidates when `pools` map changes:

```typescript
private poolsSnapshot: PoolBase[] = [];
private poolsSnapshotDirty = true;

// In subscribe():
this.poolsSnapshotDirty = true;

public async getPools(): Promise<PoolBase[]> {
  if (this.isReady && !this.poolsSnapshotDirty) {
    return this.poolsSnapshot;
  }
  // ... existing logic ...
  this.poolsSnapshot = Array.from(this.pools.values());
  this.poolsSnapshotDirty = false;
  return this.poolsSnapshot;
}
```

### B5: MLR cache invalidation is coarse-grained

**Location:** `TradeRouter.onFilterChanged()` clears entire `mlr` map

**Impact:** Low. The MLR key includes pool count (`${assetIn}->${assetOut}::${pools.length}`), but doesn't account for *which* pools changed. A balance update that doesn't change pool composition still invalidates MLR if pool count changes (e.g., a pool becomes invalid due to zero balance).

**Suggestion:** Acceptable for now. A more granular approach (e.g., including a content hash) would add complexity without significant benefit since MLR recalculation is infrequent.

### B6: `PoolContextProvider.getPoolFees()` does a linear scan

**Location:** `PoolContextProvider.getPoolFees()` line 164

**Impact:** Low. `this.clients.find(c => c.getPoolType() === pool.type)` is O(6) at most. Negligible.

**Suggestion:** Replace with a `Map<PoolType, PoolClient>` for O(1) lookup. Marginal improvement but cleaner:

```typescript
private readonly clientsByType: Map<PoolType, PoolClient<any>>;
// Built once in constructor
```

---

## 3. Sync / Resilience Concerns

### S1: `PoolStore.update()` error handling

**Issue:** `update()` catches errors via `.catch(console.error)` which silently swallows patch failures. A failed patch doesn't trigger resync or notify consumers.

**Suggestion:** Add an error callback or emit an error state:

```typescript
update(patch, onError?: (e: unknown) => void): void {
  this.updateQueue = this.updateQueue
    .then(async () => { /* ... */ })
    .catch((e) => {
      console.error(e);
      onError?.(e);
    });
}
```

### S2: Watchdog block gap threshold

**Issue:** Gap threshold is hardcoded at 3 blocks. On chains with variable block times, this may be too aggressive or too lenient.

**Suggestion:** Make configurable via constructor option, defaulting to 3.

---

## 4. Refactoring Recommendations (Prioritized)

### Priority 1: Pre-fetch fees in parallel (B3)
- **Effort:** Small (localized change in TradeRouter)
- **Impact:** High for multi-hop routes
- **Risk:** None - fees are amount-independent

### Priority 2: Cache Pool value objects (B1)
- **Effort:** Small-Medium (add generation tracking to Router)
- **Impact:** Medium - reduces allocations on hot path
- **Risk:** Low - must invalidate correctly on pool data changes

### Priority 3: Eliminate double `toPoolsMap` (B2)
- **Effort:** Small (pass poolsMap parameter)
- **Impact:** Low-Medium
- **Risk:** None - pure refactor

### Priority 4: PoolStore error propagation (S1)
- **Effort:** Small
- **Impact:** Improves debuggability
- **Risk:** None

### Priority 5: Snapshot caching in PoolContextProvider (B4)
- **Effort:** Small
- **Impact:** Low - reduces GC pressure
- **Risk:** Low - must track dirty state correctly

### Not Recommended for Refactoring

- **RouteSuggester BFS**: Already partitions search space (trusted vs isolated pools). Graph is small (< 100 nodes typically). No gain from more complex algorithms.
- **PoolClient subscription model**: The `share()` + `ReplaySubject` + watchdog pattern is well-designed and battle-tested. Restructuring would be high-risk, low-reward.
- **PoolStore serialized queue**: The promise-chain serialization is simple and correct. Lock-free alternatives would add complexity without measurable benefit at current scale.

---

## 5. Summary

The TradeRouter + Pool module architecture is **production-grade and well-optimized**. The clear separation between stateless routing (TradeRouter/Router) and stateful context (PoolContextProvider/PoolClient/PoolStore) makes the system easy to reason about and test.

The main optimization opportunities are:
1. **Fee pre-fetching** (B3) - parallel fetch of hop fees before sequential calculation
2. **Pool object caching** (B1) - avoid re-creating Pool value objects on every query
3. **Eliminating redundant work** (B2) - passing already-computed poolsMap through the call chain

These are incremental improvements on an already solid foundation. No fundamental architectural changes are warranted.
