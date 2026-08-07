# Pool Sync Engine — design proposal

> Proposal for `packages/sdk-next/src/pool/`. Replaces the **per-client driver**
> described in [SOR_v2.md](./SOR_v2.md) with **one driver** that resolves all pool
> clients per block, in dependency order.
> Nothing here is implemented — this is the design to argue with first.

## Abstract

Every pool client consumes the **same** block stream. Today each one subscribes to it
separately, so no client knows where another is: chain work is repeated per client, and a
derived pool (HSM ← Stableswap) needs coordination machinery to borrow its source's state
for the same block.

Make the driver **one thing** for the work that is genuinely shared: the subscription, the
chain lineage, and the per-block event reads. Client work stays independent — each keeps
its own serial queue, exactly as its own `concatMap` does today — and the **only** wait in
the system is the real dependency edge, where a derived pool waits for its source to finish
*that block*. A derived pool then simply *reads* its source's store: the ordering is the
guarantee, so there is nothing to negotiate — no watermark, no staged snapshot, no
forwarded feed, no second store writer.

Nothing else blocks. A slow AAVE resolve cannot delay OMNI's commit or the next block's
classification, which is the property today's independent subscriptions give and a naive
stage barrier would throw away.

---

## Why

Three costs fall out of per-client subscriptions:

- **Repeated chain work.** `ChainTracker.classify` walks `parentHash` once *per client per
  block*, and a reorg re-reads the same canonical blocks' events once per client. With 5
  clients a depth-4 reorg costs ~20 header fetches and ~20 `System.Events` reads where 4
  and 4 would do. Measured on catfish: ~57ms per header fetch, and 6 concurrent
  `eventsAt` reads pushed the health probe from 60ms to 833ms.
- **Cross-client coupling needs machinery.** HSM's stableswap-derived fields must belong to
  the same block as its cursor. Three attempts, all consequences of independence: a second
  store writer (two emissions per block, and a stale window that the differential probe
  caught at `#13488049`), a committed-cursor watermark plus `await` (folds *whatever the
  source holds now*, which can be a block ahead), and a forwarded per-block feed (works,
  but threads source pools through `tickMutations` — a hook that means "recompute drift",
  not "merge a dependency").
- **Duplicated lifecycle.** Five `switchMap` resync cycles and five watchdogs for one
  chain, one connection, and one finality stream.

The insight that removes all of it: with a single stream, block N's events already say
which pools are affected, so a dependency is an **order of processing** rather than a
message between peers.

---

## Today vs proposed

```mermaid
flowchart LR
  subgraph today["today — N drivers"]
    B1[EventBus]
    B1 --> O1[Omni driver]
    B1 --> S1[Stable driver]
    B1 --> A1[Aave driver]
    B1 --> H1[HSM driver]
    S1 -. "getSubscriber<br/>2nd writer / watermark / feed" .-> H1
  end

  subgraph proposed["proposed — 1 driver, independent client queues"]
    B2[EventBus] --> E["PoolSync<br/>lineage + shared reads only"]
    E --> Q1[omni queue]
    E --> Q2[stable queue]
    E --> Q3[aave queue]
    E --> Q4[hsm queue]
    Q2 -. "awaits stable's block N<br/>then reads stable.pools" .-> Q4
  end
```

---

## Components

| Component | Role | Change |
|---|---|---|
| `EventBus` | one `System.Events` watch, per-block emission, redelivery dedupe, `eventsAt(hash)` | unchanged |
| `ChainTracker` | chain lineage: classify / split / repair / cursor + ring | **one instance in the engine**; ring holds `{number, hash}` only |
| **`PoolSync`** | **new.** owns subscription + tracker + watchdog; drives clients in stages | new file `pool/PoolSync.ts` |
| `PoolClient` | pool-specific logic, store, consumer API, own matched-event ring | sheds the driver, resync cycle, watchdog |
| `PoolStore` | `update()` returns the queued promise so a commit can be awaited | 2-line change |

---

## Per-block pass

```mermaid
sequenceDiagram
  participant Bus as EventBus
  participant Eng as PoolSync
  participant Chain as ChainTracker
  participant Omni as omni queue
  participant Stbl as stable queue
  participant Hsm as hsm queue

  Bus->>Eng: { block, events }
  Eng->>Chain: classify(block)
  Chain-->>Eng: { missed, reorg }
  opt reorg
    Eng->>Chain: split(block)
    Chain-->>Eng: { orphaned, canonical }
  end
  Eng->>Eng: prefetch eventsAt(missed + canonical) once
  Eng->>Chain: remember / repair / apply
  par dispatch, not awaited
    Eng->>Omni: enqueue(ctx)
    Eng->>Stbl: enqueue(ctx)
    Eng->>Hsm: enqueue(ctx, waitFor: stable@N)
  end
  Eng-->>Bus: ready for block N+1
  Stbl->>Stbl: resolve + commit
  Stbl-->>Hsm: block N done
  Hsm->>Hsm: resolve + commit (reads stable.pools)
```

The engine's serial section is **lineage and shared reads only** — typically one
`getBlockHeader`, plus `d + g` events reads on a reorg or gap, which is the same work one
client does today rather than `N` times. It then dispatches and returns, so block N+1 is
classified without waiting for any client.

```ts
concatMap(async ({ block, events }) => {
  const { missed, reorg } = await this.chain.classify(block);
  const window = reorg ? await this.chain.split(block) : EMPTY_WINDOW;

  /**
   * One events read per referenced block, shared by every client.
   */
  const cache = new Map<string, Promise<DecodedEvent[]>>();
  const eventsOf = (ref: BlockRef) => {
    let p = cache.get(ref.hash);
    if (!p) cache.set(ref.hash, (p = this.bus.eventsAt(ref.hash)));
    return p;
  };

  const ctx = { block, events, missed, reorg, ...window, eventsOf };

  /**
   * Lineage advances on delivery, independent of client progress — `classify`
   * compares against the last block DELIVERED, which is what it did per client.
   */
  for (const m of missed) this.chain.remember(m);
  if (reorg) this.chain.repair(window.orphaned, window.canonical);
  this.chain.apply(block);

  /**
   * Dispatch to per-client queues; NOT awaited. `clients` is topologically
   * ordered, so a dependency's completion promise exists before its dependents.
   */
  const done = new Map<PoolClient<any>, Promise<void>>();
  for (const c of this.clients) {
    const deps = c.dependencies().map((d) => done.get(d)!);
    done.set(c, c.enqueue(ctx, deps));
  }
});
```

Each client drains its own queue in order, which preserves exactly the per-client
serialization `concatMap` gives today:

```ts
  /**
   * Queue one block behind this client's in-flight work.
   *
   * - `deps` are the source clients' completions for THE SAME block
   * - Passed DOWN rather than awaited here, so this client's own effects and
   *   handlers run while the source is still resolving; only the merge waits
   * - Failures are contained: log, reseed, and the queue continues, so a
   *   dependent is never stuck waiting on a broken source
   */
  enqueue(ctx: BlockContext, deps: Promise<void>[]): Promise<void> {
    this.queue = this.queue
      .then(() => this.applyBlock(ctx, Promise.all(deps)))
      .catch((e) => {
        this.log.error('apply_block', e);
        this.requestResync();
      });
    return this.queue;
  }

Client side — same work as today's `subscribeEvents` body, minus the lineage:

```ts
  /**
   * Resolve and commit one block.
   *
   * - Seeds on first call (pinned `loadPools`), then resolves per block
   * - Returns once the commit landed, so dependents can read the store
   */
  async applyBlock(ctx: BlockContext, ready: Promise<unknown>): Promise<void> {
    if (!this.seeded) return this.seed(ctx.block);

    const muts: PoolMutation<T>[] = [];

    for (const m of ctx.missed) {
      muts.push(...(await this.resolve(m, await ctx.eventsOf(m))));
    }
    if (ctx.reorg) muts.push(...(await this.heal(ctx)));

    /**
     * Own effects/handlers already ran; the tick's merge is the only part
     * that needs the source's commit for this block.
     */
    muts.push(...(await this.resolve(ctx.block, ctx.events, ready)));

    if (muts.length > 0 || ctx.reorg) {
      await this.store.update((state) => {
        this.block = ctx.block.number;
        this.blockHash = ctx.block.hash;
        return this.applyMutations(state, muts);
      });
    }
    this.remember(ctx.block, touched);
  }
```

`await this.store.update(...)` is the whole ordering mechanism. `PoolStore.update` already
serializes on a promise queue; returning it removes every microtask-ordering argument the
watermark and feed designs needed.

---

## Reorg pass

Lineage is global, but **matched events are per client** — each client matched different
events on the orphaned fork. So the split is shared and the replay is local:

- `ChainTracker.split(block)` returns `{ orphaned: BlockRef[], canonical: BlockRef[] }` —
  hashes only, no `touched`.
- Each client keeps its own bounded `Map<hash, DecodedEvent[]>` of what *it* matched per
  applied block (same data as today's ring, same `REORG_DEPTH` bound).
- `client.heal(ctx)` = own touched for `orphaned` hashes, plus its matches from
  `ctx.eventsOf(canonical)`, rereaad at the new tip; then drop those hashes.

The canonical blocks' events are fetched **once** for all clients. The `depth === canon`
invariant and the pairing rules stay exactly as documented in
[SOR_v2.md](./SOR_v2.md#heal--bounded-history--reread).

---

## Dependency edges

```ts
  /** Clients whose committed state this one derives from */
  protected dependencies(): PoolClient<any>[] {
    return [];
  }
```

HSM returns `[this.stableClient]`; everything else returns `[]`. There are no stages and no
barrier — the engine topologically **orders** registered clients so each dispatch can hand a
dependent its sources' completion promises for that block, and a cycle throws at
registration. The waiting is edge-local: HSM's block N waits for stableswap's block N, and
nothing else in the system waits for anything.

That leaves the blast radius of a slow client exactly where it belongs. If stableswap is
slow, HSM lags with it (it cannot price without it) while omni, xyk, aave and lbp are
untouched. If HSM is slow, nobody waits.

HSM's merge becomes a plain read with a reference check, entirely inside HSM:

```ts
  protected async tickMutations(): Promise<PoolMutation<HsmPoolBase>[]> {
    const muts: PoolMutation<HsmPoolBase>[] = [];
    for (const pool of this.store.pools) {
      const stablePool = this.stableClient.pools.find((s) => s.id === pool.id);
      if (!stablePool || this.merged.get(pool.id) === stablePool) continue;
      this.merged.set(pool.id, stablePool);
      muts.push({ address: pool.address, apply: (p) => ({ ...p /* fields */ }) });
    }
    return muts;
  }
```

`PoolStore.update` replaces only the pools it touched and leaves the rest as the same
object, so **reference identity is the "did my source change" test** — no dirty set, no
staged snapshot, and unchanged upstream still means no muts, no commit, no emission. It
needs a public `get pools()` on `PoolClient` (protected members aren't reachable across
sibling subclasses), which also lets the `pools()` probe subclasses in `probeAmms.ts` go.

---

## Lifecycle & registration

The engine is lazy and shared, like `EventBus`:

```ts
  getSubscriber(): Observable<T[]> {
    return defer(() => {
      const sub = PoolSync.shared(this.client).register(this);
      return this.store.asObservable().pipe(
        skip(1),                       // drop replay; first emission is the fresh seed
        finalize(() => sub.unsubscribe())
      );
    }).pipe(/* changeset delta + share, as today */);
  }
```

- `register(client)` pulls in `dependencies()` transitively, re-sorts stages, and starts
  the subscription if idle. A dependency is driven even when nobody subscribes to it.
- Last unregister stops the subscription and clears the tracker.
- **Standalone pinned clients are unaffected** — `getPools(at)` never registers, so the
  `probeAmms` reference loaders and consumer-created clients keep working as-is.

---

## Resync & watchdog

Per-client `resync$` + `switchMap` cycles collapse into per-client **seed flags** on the
engine:

- `client.requestResync()` → `engine.reseed(client)` → clears that client's `seeded` flag;
  the next block seeds it pinned at that block. No cycle teardown, no `mem` bump.
- One watchdog in the engine: finalized-gap (`>= 3`), periodic (60 min), connection
  recovery → reseed **all** clients.
- `watchGuard` becomes engine-level: a stream error restarts the subscription and reseeds
  everyone.

Reseeding one client no longer disturbs the others, which today's shared-ref-count teardown
can do.

---

## Cost

Per block, `N` registered clients, reorg depth `d`, gap `g`:

| work | today | proposed |
|---|---|---|
| `getBlockHeader` (classify) | `N` | 1 |
| `getBlockHeader` (fork walk) | `N × d` | `d` |
| `eventsAt` (canonical) | `N × d` | `d` |
| `eventsAt` (gap backfill) | `N × g` | `g` |
| store writers per pool | 1, or **2** for HSM | 1 |
| emissions per block per pool | 1, or **2** for HSM | ≤ 1 |

A depth-4 reorg with 5 clients goes from ~40 chain calls to ~8 — on the exact hot path
where fork churn already slows the node (see the unincluded-segment note in
[SOR_v2.md](./SOR_v2.md#why-reorgs-are-frequent-right-now)).

---

## Risks & mitigations

- **The engine's serial section is now shared.** Lineage classification is sequential by
  nature, so a slow `getBlockHeader` delays *all* clients' dispatch for that block — where
  today it would delay only the client that made the call. The section is bounded (one
  header fetch in the steady state, `d + g` events reads on a reorg or gap) and does
  strictly less total work than N clients doing it independently, but it is a shared
  latency floor and should be logged as pass duration.
- **A lagging client can apply an orphaned block it hasn't reached yet.** Lineage advances
  on delivery, so the engine may already know block N-1 was orphaned while a slow client is
  still queued on it. That client applies the fork state, then heals when the reorg context
  reaches it — per-client ordering is preserved, so this self-corrects exactly as it does
  today.
- **Dependents inherit their source's lag by design.** HSM cannot commit block N before
  stableswap does; that edge is inherent to deriving state, and it is the same edge today's
  dual writer has. What changes is that it no longer leaks into unrelated clients.
- **Failure isolation.** A throwing or timing-out client must not wedge its dependents:
  `enqueue` catches, logs, and reseeds, so its completion promise always settles.
- **Bigger blast radius.** One engine touching all pool types means a regression hits
  everything; hence the phased migration below, with the differential probe as the gate.

---

## Migration

Each phase is independently testable, and the probe (`probeAmms.ts`) is the gate.

| phase | change | check |
|---|---|---|
| 1 | `PoolStore.update` returns its queued promise | unit tests |
| 2 | add `PoolSync`; move driver + lineage + watchdog out of `PoolClient`; revert the `processed$` / `blockSource` / `DrivenBlock` feed; one shared `eventsOf` | 20-min probe with omni + stable + xyk + aave through reorg churn |
| 3 | `dependencies()` + per-block edge waits; HSM tick reads `stableClient.pools`; public `get pools()`; drop `pools()` probe overrides | probe with **HSM enabled** — one check line per block, no duplicate, `#13488049`-class staleness gone |
| 4 | fold this document into `SOR_v2.md` as the current design | — |

The interim feed design (`processed$` + `blockSource`, currently in the working tree and
green on tests) is a **temporary** step: correct, but it pays for the coupling with a
payload parameter on `tickMutations`. Phase 2 deletes it.

---

## Open questions

1. Dependent behaviour when a source client times out or is mid-reseed — skip the merge
   this block, or merge the last known state? (`enqueue` guarantees the wait *ends*; what
   the dependent does with a source that failed is still open.)
2. Should the engine expose pass telemetry (duration, per-client resolve time) as a debug
   log, given fork churn is the dominant latency source right now?
3. `REORG_DEPTH` currently bounds both tracker lineage and each client's matched-event
   ring — keep one constant, or let a client keep a shallower ring?
4. Do we want `applyBlock` to be `protected` (engine as a friend via a narrow internal
   interface) or public on `PoolClient`? A narrow `PoolSyncTarget` interface keeps the
   public surface honest.
