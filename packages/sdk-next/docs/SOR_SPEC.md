# TradeRouter & Pool Module - Architecture Spec

> **Package:** `sdk-next` | **Date:** 2026-03-14
> **Scope:** `src/sor/TradeRouter.ts`, `src/sor/Router.ts`, `src/pool/*`

---

## 1. Architecture Overview

### Component Diagram

```
Consumer
  |
  v
TradeRouter (stateless, except MLR cache)
  |
  +--> Router (base: pathfinding, pool filtering, validation)
  |      |
  |      +--> RouteSuggester (BFS graph traversal)
  |      +--> PoolFactory (PoolBase -> Pool value objects)
  |
  +--> IPoolCtxProvider (injected context)
         |
         +--> PoolContextProvider (stateful orchestrator)
                |
                +--> PoolClient<T> (per-type: Omni, XYK, Stable, LBP, Aave, HSM)
                |      |
                |      +--> PoolStore<T> (BehaviorSubject + queue)
                |      +--> PoolLog
                |      +--> QueryBus (TLRU-cached RPC scopes)
                |      +--> Watchdog (connection recovery, block gap detection)
                |
                +--> pools: Map<string, PoolBase> (aggregated snapshot)
```

### Statefulness Map

| Component             | Stateful? | State description                                      |
|-----------------------|-----------|--------------------------------------------------------|
| **TradeRouter**       | Minimal   | `mlr: Map<string, Hop[]>` - most-liquid-route cache    |
| **Router**            | Minimal   | `routeProposals: Map` - BFS result cache, `filter`     |
| **PoolFactory**       | None      | Pure static factory                                    |
| **PoolContextProvider** | **Yes** | `pools: Map<string, PoolBase>`, `active: Set`, `isReady` |
| **PoolClient\<T\>**  | **Yes**   | `PoolStore<T>`, memoized seed, QueryBus live caches, resync state |
| **PoolStore\<T\>**   | **Yes**   | `BehaviorSubject<T[]>`, serialized update queue, changeset |
| **QueryBus scope**    | **Yes**   | `live: Map` (subscription-fed) + `cache: TLRUCache` (RPC-fed) |

**Verdict:** TradeRouter is effectively stateless from the consumer's perspective. All mutable state lives in `PoolContextProvider` -> `PoolClient` -> `PoolStore` chain. This is already a strong design.

---

## 2. Data Flow

### Initial Load (`getPools()`)

```
TradeRouter.withCtx()
  -> Router.getPools()
    -> ctx.getPools()
      -> PoolContextProvider.getPools()
        if (isReady):
          return pools.values()            // O(n) Map iteration
        else:
          Promise.all(activeClients.map(c => c.getPools()))
            -> PoolClient.getPools()
              -> memoize1(mem) -> loadPools()   // TLRU 6s TTL
              -> filter(hasValidAssets)
          isReady = true
          return flat pools
```

### Subscription Flow (live updates)

```
PoolContextProvider.withOmnipool()
  -> subscribe(client)
    -> client.getSubscriber()
      -> subscribeStore() [shared via ReplaySubject(1)]
        -> resync$.pipe(switchMap(...))
          1. Seed: getMemPools() -> store.set(valid)
          2. Attach writers:
             - subscribeBalances() -> store.update(patch)
             - subscribeUpdates()  -> store.update(patch) [pool-type specific]
          3. Emit: merge(seed, store$.pipe(skip(1)))
      -> getSubscriber() post-processing:
        -> bufferCount(2,1) + changeset filter
        -> throttleTime(1000)
    -> pools.set(address, poolBase) per emission
```

### Trade Execution (`getBestSell`)

```
TradeRouter.getBestSell(assetIn, assetOut, amountIn)
  -> withCtx(assetIn, assetOut, fn)
    -> pools = await getPools()
    -> poolsMap = validateInput(assetIn, assetOut, pools)    // PoolFactory.get() per pool
    -> paths = getPaths(assetIn, assetOut, pools)            // BFS + validation
    -> Promise.all(paths.map(p => toSellSwaps(amountIn, p, poolsMap)))
      -> per hop: pool.parsePair(), ctx.getPoolFees(), pool.validateAndSell()
    -> findBestSellRoute(routes)
    -> buildSell(poolsMap, swaps)
```

---

## 3. Component Deep-Dive

### 3.1 TradeRouter (`src/sor/TradeRouter.ts`)

**Responsibilities:**
- Best-route selection (sell/buy) across all paths
- Multi-hop swap chain execution with fee/spot/impact calculation
- Most-liquid-route (MLR) caching for spot price queries
- Trade result composition with `toHuman()` serialization

**Key characteristics:**
- Fully async, no blocking operations
- Routes evaluated in parallel via `Promise.all`
- MLR cache keyed by `${assetIn}->${assetOut}::${poolCount}` - invalidates on filter change
- `buildCtxSync` separates sync validation from async pool fetching

**Public API:**
| Method | Description |
|--------|-------------|
| `getBestSell(in, out, amount)` | Best sell route |
| `getBestBuy(in, out, amount)` | Best buy route |
| `getSell(in, out, amount, route?)` | Sell with optional explicit route |
| `getBuy(in, out, amount, route?)` | Buy with optional explicit route |
| `getSells(in, out, amount)` | All valid sell routes sorted |
| `getBuys(in, out, amount)` | All valid buy routes sorted |
| `getMostLiquidRoute(in, out)` | Cached MLR |
| `getSpotPrice(in, out)` | Spot price via MLR |

### 3.2 Router (`src/sor/Router.ts`)

**Responsibilities:**
- Pool filtering (useOnly/exclude)
- Asset validation
- BFS-based path discovery via `RouteSuggester`
- `PoolBase -> Pool` conversion via `PoolFactory`

**Concern:** `toPoolsMap()` calls `PoolFactory.get()` for every pool on *every* `withCtx` call (i.e. every trade query). These are lightweight value-object constructors, but the allocation pressure is non-trivial at scale.

### 3.3 PoolContextProvider (`src/pool/PoolContextProvider.ts`)

**Responsibilities:**
- Fluent builder for activating pool types (`withOmnipool()`, `withXyk()`, etc.)
- Aggregates all pool data into a single `Map<string, PoolBase>`
- Routes `getPoolFees()` to the correct client
- Lifecycle management (`destroy()`)

**Key design:**
- `isReady` flag: first `getPools()` call loads from chain, subsequent calls use subscription-fed map
- Subscription model: each `with*()` subscribes to the client's `getSubscriber()` observable
- HSM auto-activates Stableswap dependency

### 3.4 PoolClient\<T\> (`src/pool/PoolClient.ts`)

**The workhorse.** Abstract base for all 6 pool types.

**State management:**
- `PoolStore<T>`: reactive store with serialized update queue
- `memPools`: memoize1 with TLRU (6s TTL) for seed caching
- `mem` counter: incremented on resync to bust memoization
- `resync$`: ReplaySubject that triggers full cycle rebuilds

**Subscription lifecycle:**
1. `subscribeStore()` creates a `share()`d observable with `ReplaySubject(1)` connector
2. On each `resync$` emission: seed -> attach balance + update writers -> emit store
3. `subscribeBalances()`: watches token balances per pool, buffers 250ms, batch-updates store
4. `subscribeUpdates()`: pool-type-specific chain watchers (abstract)

**Resiliency:**
- **Watchdog**: monitors connection status (offline->online recovery) and block gaps (>= 3 blocks)
- **watchGuard**: operator that catches errors, logs, triggers forced resync
- **requestResync**: dedup'd via `resyncPending` flag, deferred to next tick
- **RESYNC_THROTTLE**: 3s cooldown between resyncs

### 3.5 PoolStore\<T\> (`src/pool/PoolStore.ts`)

**Responsibilities:**
- Holds canonical pool state as `BehaviorSubject<T[]>`
- Serialized updates via promise queue (`updateQueue`)
- Changeset tracking for delta emissions

**Key properties:**
- `set()`: full replacement (used on seed)
- `update(patch)`: queued merge (used by live writers)
- Changeset: `Set<string>` of modified addresses, reset per update

### 3.6 QueryBus (`src/utils/QueryBus.ts`)

Two-tier cache per scope:
1. **`live` Map**: populated by subscription writers (hot, always fresh)
2. **`cache` TLRUCache**: populated by RPC fetches (cold, TTL-bounded)

Lookup order: live -> cache -> fetch. This is critical for fee lookups during trade execution.

---

## 4. Pool Type Implementations

| Type | Client | Pool (value object) | Math | Notable |
|------|--------|---------------------|------|---------|
| Omni | `OmniPoolClient` | `OmniPool` | `OmniMath` (WASM) | Dynamic fees, EMA oracles, slip fee, hub asset (LRNA) routing |
| XYK | `XykPoolClient` | `XykPool` | `XykMath` (WASM) | Constant-product, override support for decimals |
| Stable | `StableSwapClient` | `StableSwap` | `StableMath` (WASM) | Multi-asset amplified pools |
| LBP | `LbpPoolClient` | `LbpPool` | `LbpMath` (WASM) | Weight-shifting, time-dependent |
| Aave | `AavePoolClient` | `AavePool` | N/A (1:1) | EVM bridge, supply/withdraw semantics |
| HSM | `HsmPoolClient` | `HsmPool` | `HsmMath` | Depends on StableSwap pools, composite |

All math modules use WASM bindings for computation - calculations are CPU-bound but fast.

---

## 5. Sync / Resilience Model

### Current Sync Model

```
Chain -> PoolClient subscriptions -> PoolStore -> PoolContextProvider.pools Map -> Router snapshot
```

Each `getPools()` call takes a **snapshot** of the aggregated map. This is eventually consistent: pool data can be stale by up to:
- **Balance**: ~250ms (bufferTime) + ~1s (throttleTime) = ~1.25s after on-chain change
- **Pool state** (e.g., Omni hub_reserve): depends on subscription latency, typically < 1 block
- **Fees**: QueryBus TLRU TTL (6s for dynamic fees/oracles) or live subscription

### Sync Characteristics

#### `isReady` flag behavior

First `getPools()` call loads from chain (slow, ~seconds). All subsequent calls return the subscription-fed map (fast). `isReady` is only set after the initial `Promise.all` load completes. Subscription data accumulates in parallel. The seed is authoritative until subscriptions take over.

#### Cross-client consistency during aggregation

`PoolContextProvider.pools` aggregates from multiple independent subscription streams. During a multi-pool trade evaluation, the Omni pool data might be from block N while XYK data is from block N-1. This is inherent to the subscription model and acceptable. A block-pinned snapshot would require coordinated reads across all clients, defeating the purpose of reactive updates. The existing throttling (1s) already reduces the window of inconsistency.
