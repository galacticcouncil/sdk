# TradeRouter & Pool Module - Architecture Spec

> **Package:** `sdk-next` | **Date:** 2026-03-14
> **Scope:** `src/sor/TradeRouter.ts`, `src/sor/Router.ts`, `src/pool/*`
> **Related:** [SOR_ENGINE.md](SOR_ENGINE.md) — how the pool stores are kept in sync;
> this spec covers routing and the consumer surface.

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
                |      +--> PoolQuery (named scopes over QueryCache)
                |
                +--> pools: Map<string, PoolBase> (aggregated snapshot)

PoolSync (singleton) -- drives every registered PoolClient per block
  |
  +--> EventBus (bestBlocks$ diff + pinned events reads)
  +--> Watchdog (connection recovery, finalized gap, periodic)
```

### Statefulness Map

| Component             | Stateful? | State description                                      |
|-----------------------|-----------|--------------------------------------------------------|
| **TradeRouter**       | Minimal   | `mlr: Map<string, Hop[]>` - most-liquid-route cache    |
| **Router**            | Minimal   | `routeProposals: Map` - BFS result cache, `filter`     |
| **PoolFactory**       | None      | Pure static factory                                    |
| **PoolContextProvider** | **Yes** | `pools: Map<string, PoolBase>`, `active: Set`, `isReady` |
| **PoolClient\<T\>**  | **Yes**   | `PoolStore<T>`, block cursor, matched-event ring, seeded flag |
| **PoolStore\<T\>**   | **Yes**   | `BehaviorSubject<T[]>`, serialized update queue, changeset |
| **QueryCache scope**  | **Yes**   | `live: Map` (event-fed) + `cache: TLRUCache` (fetch-fed) |
| **PoolSync**          | **Yes**   | singleton: subscription, registered clients + order, watchdog |

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
      -> PoolSync.shared(client).register(this)   // engine drives the store
      -> store.asObservable().pipe(skip(1))       // drop replay; first emission is the seed
      -> bufferCount(2,1) + changeset delta
      -> share({ ReplaySubject(1), resetOnRefCountZero: true })
    -> pools.set(address, poolBase) per emission
```

Each emission is the **delta** — only pools whose state changed in that block.

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
- `block` / `blockHash`: the committed cursor, assigned inside the commit
- `blockMatched`: bounded ring of the events this client matched per applied block
- `seeded` flag: cleared by `requestResync()`; the next pass reseeds pinned

**Per-block lifecycle** — driven by `PoolSync`, not by a per-client subscription:
1. `syncBlock(ctx, deps)` queues the pass behind this client's in-flight work
2. `applyBlock` replays orphaned/gap-filled matches, resolves the tip, awaits sources
3. Tick + reconcile, then one `store.update` per block

**Resiliency:** one engine-level watchdog (connection recovery, finalized gap, periodic),
and a failing pass is contained — logged, reseeded, queue continues.

See [SOR_ENGINE.md](SOR_ENGINE.md) for the full model.

### 3.5 PoolStore\<T\> (`src/pool/PoolStore.ts`)

**Responsibilities:**
- Holds canonical pool state as `BehaviorSubject<T[]>`
- Serialized updates via promise queue (`updateQueue`)
- Changeset tracking for delta emissions

**Key properties:**
- `set()`: full replacement (used on seed)
- `update(patch)`: queued merge (used by live writers)
- Changeset: `Set<string>` of modified addresses, reset per update

### 3.6 QueryCache (`src/utils/QueryCache.ts`)

Two tiers per scope:
1. **`live` Map**: written by an event (`set`/`refresh`), no expiry, checked first
2. **`cache` TLRUCache**: the fetch tier, memoized per policy — `'block'`, `'persistent'`,
   or a numeric TTL

Lookup order: live -> cache -> fetch, with unpinned reads never memoized. Every read is
attributed to a tier and, when it hits the chain, to its scope — so the heaviest query is
visible at runtime via `tally`.

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

### Sync Model

```
bestBlocks$ -> EventBus -> PoolSync -> PoolClient queues -> PoolStore
            -> PoolContextProvider.pools Map -> Router snapshot
```

One driver resolves every client per block, so a committed store is block-pinned and cannot
tear. Each `getPools()` call takes a **snapshot** of the aggregated map. Everything is exact
as of its client's committed block except two converging fields — oracle-driven `pegs.*` and
interest-bearing (aToken) reserves — bounded under 1 bp. See
[SOR_ENGINE.md](SOR_ENGINE.md#accuracy--drift).

### Sync Characteristics

#### `isReady` flag behavior

First `getPools()` call loads from chain (slow, ~seconds). All subsequent calls return the subscription-fed map (fast). `isReady` is only set after the initial `Promise.all` load completes. Subscription data accumulates in parallel. The seed is authoritative until subscriptions take over.

#### Cross-client consistency during aggregation

`PoolContextProvider.pools` aggregates per-client stores. Each store is internally coherent
for its own committed block, but clients commit independently, so a multi-pool evaluation can
mix block N and block N-1 across pool types. Clients resolve the same pass in parallel, so
the window is one block and only widens when a client is slow — a derived pool (HSM) is the
one case that is ordered, since it waits for its source's block before merging.
