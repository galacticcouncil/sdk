# SOR v2 — Event-Driven Pool Sync

> Design spec / context summary for the `sdk-next` pool sync engine (branch `feat/eds`).
> Scope: `packages/sdk-next/src/pool/` — `PoolClient`, `EventBus`, the AMM clients, and the `verifyEds` probe.

## Abstract

Every AMM pool client is driven off **one** upstream: the chain's `System.Events`,
watched at `best`. A single subscription both **seeds** the store (one coherent,
block-pinned snapshot) and **drives** it (one commit per block: effects → handlers →
tick → reserve reconcile, all folded into a single `store.update`). Because
`System.Events` is one storage item read once per block, an emission carries that
block's whole event vector **atomically** — so a coupled multi-storage change can no
longer be observed torn across blocks, and there is no cross-subscription skew.

The stream follows **best**, not finalized, because finality can lag ~30s — too late to
price a market. Best is fork-prone, so the driver detects reorgs on a `parentHash` chain
and **heals them inline** at the new tip by replaying recent handlers — no polling, no
finality wait, no periodic resync, and without waiting for the next trade to touch the
stale asset.

Correctness is proven by a differential probe (`verifyEds.ts`) that diffs the live
event-driven store against a fresh block-pinned reload, field by field, over a 20-minute
window.

---

## Motivation

The properties the design must guarantee:

- **No tearing.** Coupled state that changes together on-chain (e.g. an omnipool
  asset's `reserve` + `hub_reserve`, a stableswap's reserves + pegs) must never be
  observed half-updated across two blocks.
- **No cross-sub skew.** Independent per-storage watchers can deliver at slightly
  different times; the snapshot must come from a single coherent point.
- **React on best.** Finalization can take up to ~30s; a market view that waits for
  finality is stale. The store must track `best`.
- **Survive best-block reorgs.** `best` forks. State read on an orphaned fork must heal
  to canonical **without** waiting for a trade to re-touch the asset, and **without** a
  periodic full resync.

---

## Core design

### Single upstream — `EventBus`

`EventBus.watchBlockEvents()` wraps `System.Events.watchValue({ at: 'best' })`. One
storage read per block ⇒ one emission = `{ block: BlockRef, events: DecodedEvent[] }`
for that block, atomically. This is the property everything else leans on.

Re-deliveries of the current best (the follower re-emits it after a chainHead restart)
are dropped by hash before decode — a re-delivery would double-apply handlers and
pollute reorg history. Same-height forks still pass (different hash).

`EventBus.eventsAt(hash)` reads a block's decoded events **pinned** at a hash — used to
replay blocks the best-watch skipped and the canonical blocks a reorg displaced.

> `watchValue({at:'best'})` is a **latest-value** watch, not a per-block feed. When the
> consumer lags (slow seed, GC pause) it delivers the newest best and **skips**
> intermediate blocks. The driver closes those gaps itself (see *Gap backfill*).

### One stream seeds AND drives

`subscribeEvents()` is the whole engine:

1. **Seed (first emission).** `loadPools(block.hash)` builds a full, coherent pool set
   pinned at that block. Its own events are **not** re-applied — the snapshot already
   reflects them. Handlers/effects are built *after* the seed so they see a populated
   store. Cursor `lastBlock`/`lastHash` is set to the seed block.
2. **Drive (every later emission).** Classify the block, resolve its mutations, commit
   them in one `store.update`.

### Pinned reads

Every read that contributes to a snapshot is pinned at a block hash: `loadPools(at)`,
`balance.getBalanceAt(acct, id, at)`, `Omnipool.Assets.getValue(id, { at })`, etc. A
snapshot therefore cannot tear across blocks even if best moves mid-resolve.

### Cursor-at-commit

`this.block` / `this.blockHash` are the committed cursor consumers read. They are
assigned **inside** the `store.update` patch (not eagerly at the top of the `concatMap`),
so the cursor a consumer observes is always coherent with the emission it accompanies.
`PoolStore.update` commits on a microtask queue; setting the cursor eagerly would let a
consumer read a hash ahead of the emitted state.

---

## Per-block resolution

For each driven block, `resolve(block, events)` produces `{ muts, handled }`:

| Stage | Source | Produces |
|---|---|---|
| **Effects** | `syncEffects()` → `PoolEventEffect.apply(e, block)` | side-effects only (cache refresh, param stash, `requestResync`); run first so the caches the tick reads are fresh |
| **Handlers** | `syncHandlers()` → `PoolEventHandler.resolve(e, block)` | `PoolMutation[]` by re-reading absolute state pinned at `block.hash` |
| **Tick** | `tickMutations(block)` | per-block recompute for values that drift between events — peg convergence, amp/weight ramp |
| **Reconcile** | `balanceMutations(block)` → `reconcileBalances(block)` | periodic re-read of interest-bearing reserves (below) |

`touched` = the events matched by a handler or effect in this block; kept for reorg replay.

All muts for the block (plus any backfilled/reread muts) commit in **one**
`store.update` → one downstream emission per block.

### Reserve reconcile

Most state is exact from seed + events. The exception is **interest-bearing (aToken)
reserves**, which accrue every block with no event. `balanceMutations` gates
`reconcileBalances` to run once every `BalanceClient.erc20SafetyRereadBlocks` (**20**)
blocks — the single source of the cadence.

- **Base `reconcileBalances`**: re-reads every `Erc20` reserve at `pool.address`, commits
  only what changed.
- **Aave override**: re-reads both legs via the trade executor (`reserveMutations`).
- **HSM override**: re-reads erc20 collateral held at the facilitator
  (`collateralMutations`); stableswap fields come from the sibling snapshot merge.

This is complementary to the seed/reorg machinery — it covers genuinely *eventless*
accrual, not skew.

---

## Gap backfill

When best skips blocks, the delivered block is ahead of `lastBlock + 1`. `trace()` walks
`parentHash` from the delivered block back down to `lastBlock + 1`, enumerating the
skipped **canonical** blocks (`missed`, ascending). Each is resolved at its **own** pinned
hash via `eventsAt`, and all of it — missed blocks + current block — folds into the
**same** commit. The catch-up is therefore a single coalesced emission, not a burst.

Backfilled blocks are remembered in the reorg ring like driven blocks, so a later
reorg forking below the gap can still replay them.

---

## Reorg handling

`best` forks. A seed or a live block can land on an orphaned fork. Assets whose sync is
**trade-gated** (omnipool re-reads an asset only when a trade names it) do **not**
self-heal — the orphaned value persists as residue until the asset trades again. This is
the core problem SOR v2 must solve while staying on best.

### Detection — `trace()`

`trace(block, lastBlock, lastHash) → { missed, reorg }` classifies each delivered block in
one `parentHash` walk:

- `block.number <= lastBlock` → **reorg** (tip replaced at the same or lower height);
  returns immediately, no header fetch.
- otherwise walk `parentHash` from `block` to `lastBlock + 1`; the block at
  `lastBlock + 1` must have `parentHash === lastHash`. If not, the chain diverged at or
  below our tip → **reorg**. (A number-only check misses this *forward* reorg, where
  `block.number > lastBlock` but the ancestry differs.)

### Heal — bounded history + `reread()`

- A bounded ring buffer `history: { number, hash, touched }[]` keeps the last
  **`REORG_DEPTH = 16`** applied blocks' matched events — driven and backfilled blocks
  alike.
- On reorg, `orphaned()` walks the new tip's ancestry back to the fork point and splits
  the window: applied blocks NOT on the new chain (**orphaned**), and the new-chain
  blocks that displaced them (**canonical**) — blocks whose events the driver never saw.
- `reread()` re-runs the **union** at the new tip: the orphaned blocks' touched events
  plus the canonical blocks' matched events (fetched via `eventsAt`). Events serve as
  pointers to dirty assets — each handler re-reads absolute state pinned at the tip, so
  one pass heals orphaned residue AND applies the displaced blocks. These muts are
  appended **last**, so the newest reads win; re-reading an asset that wasn't actually
  orphaned is a harmless no-op (same value).
- The ring is repaired afterwards: orphaned entries are dropped and the canonical
  replacements spliced in, so a later reorg classifies against the applied canonical
  chain instead of re-replaying stale residue.
- The block commits even when the heal produced no mutations, so the cursor can't stay
  pinned to an orphaned hash (an empty changeset emits nothing downstream).
- A forward reorg pairs orphaned/canonical 1:1, so `depth === canon` in the reorg log;
  `canon < depth` ⇒ tip at same/lower height, `canon > depth` ⇒ ring hole.
- **Empty history** happens only for the first block after a (re)seed. The seed is already
  a full coherent snapshot, so there is nothing to replay — the driver just proceeds. It
  does **not** resync here (see below).

### Cost

`trace` adds header fetches only:

| case | `getBlockHeader` calls |
|---|---|
| consecutive block (no gap) | 1 (final parent check) |
| one skipped block (gap 1) | 2 |
| same-height tip-swap reorg (`<= lastBlock`) | 0 (early return) |

A depth-`d` heal adds ~`d` `getBlockHeader` (fork-point walk), `d` pinned
`System.Events` reads for the displaced canonical blocks, and one batch of re-reads for
the distinct dirty assets — reorg blocks only; the steady state stays ~1
`getBlockHeader`/block. A logged depth can also be several shallow best-flips coalesced
by the latest-value watch while the driver was mid-commit. No polling, no finality wait.

### Why reorgs are frequent right now

The chain currently runs `BLOCKS_PER_RELAY_PARENT = 3` (2s blocks, max unincluded
segment 9). Collators build ahead of relay inclusion; a dropped segment is rebuilt at
the same heights, surfacing as constant-depth forward reorgs (e.g. depth-4 clusters,
often content-identical → `replayed: 0`). Expected to subside once the node-side
target-block-rate fix lands; depth stays well under `REORG_DEPTH` either way. The same
churn momentarily slows node RPC — which is what trips the connection watchdog's
health probe during bad patches.

---

## Resync & watchdog

`requestResync(force?)` schedules a rebuild on the next tick (deduped); `resync` bumps
`mem` (busts memoized seeds), emits on `resync$` to restart the cycle, and is throttled by
`RESYNC_THROTTLE` unless forced.

`startWatchdog()` runs three **edge-triggered** resync sources, merged:

- **recovery** — connection `offline → online` transition.
- **gap** — a `>= 3` jump in **finalized** block number (finalized is monotonic and
  reorg-immune, so best-block reorgs never trip it).
- **periodic** — an unconditional resync every 60 min.

None of these observe post-resync state, so a resync cannot feed back into its own
trigger. The watchdog is subscribed on the outer `session` (not the per-resync `cycle`),
so it survives resyncs; and the finalized/connection streams keep flowing during a
resync, so a resync can't induce a gap in itself.

`watchGuard(tag)` treats any stream error as fatal: log + forced resync; the outer cycle
rebuilds.

> Note: `connection$` is a request-latency probe (`system_health`, 10s timeout) on the
> shared socket, ~50ms steady-state. Node fork-churn episodes can push it past the
> timeout, so a bad patch may fire several genuine `offline → online` resyncs in a row —
> correct for real outages, eager during churn.

---

## Consumer API

- **`getSubscriber(): Observable<T[]>`** — shared, ref-counted. Internally `bufferCount(2, 1)`
  + `applyChangeset` so each emission is the **delta** (only pools that changed). Backed by
  `share({ connector: ReplaySubject(1), resetOnRefCountZero: true })`, so late subscribers
  get the latest snapshot immediately.
- **`getPools(at = this.at): Promise<T[]>`** — ad-hoc, fully-pinned load; also seeds the
  store for consumer-created clients.

`subscribeStore()` wires it: seed+drive (`subscribeEvents`) and a supplementary reactive
writer (`subscribeUpdates`, e.g. HSM ← Stableswap snapshot merge, writing disjoint fields)
run inside one switch-mapped cycle; the store's `BehaviorSubject` replay is dropped
(`skip(1)`) so the first emission is the fresh seed.

---

## Validation — `verifyEds.ts`

Differential probe (runs against `ApiUrl.Catfish1`):

- Subscribe to the live store via `getSubscriber()`. Each emission is a committed snapshot
  with a coherent cursor (`blockNo`/`hash`).
- Reload the **same** block on a fresh block-pinned client and diff field-by-field
  (`flatten` → `path → scalar`, tokens keyed by id so order doesn't matter).
- **Drift tolerance.** Converging fields — aToken `*.balance` and oracle-driven `pegs.*` —
  are allowed within `DRIFT_PPM = 100n` (0.01%); everything else must be exact. These lag a
  fresh read by a bounded, sub-ppm amount because they're tracked from event-refreshed
  caches / per-block convergence.
- `OmniProbe.diagnose` can trace an asset's `hub_reserve` trajectory across a window
  (`MOVED` / `traded` / event-count flags) to distinguish a handler gap from a reorg.

### Result (20-min Catfish run)

```
omni:   { checks: 67,  ok: 67,  bad: 0, drift: 42,   skip: 0 }
stable: { checks: 179, ok: 179, bad: 0, drift: 1491, skip: 0 }
```

`bad = 0` across ~20 depth-1 reorgs (each logged and healed inline), zero resyncs after the
seed, blocks kept sequential. `drift` is the tolerated peg/aToken convergence counter, not
error.

---

## Invariants

- One emission per block belongs to exactly one block (atomic `System.Events`).
- A committed snapshot is fully block-pinned — it cannot tear.
- The cursor (`block`/`blockHash`) a consumer reads is coherent with the emission.
- Skipped best blocks are backfilled from canonical `parentHash`; nothing is silently
  dropped.
- A best-block reorg heals to canonical at the reorg block itself (within `REORG_DEPTH`),
  without a trade, without finality, without a periodic resync.
- Resync is edge-triggered only; it can never feed back into its own trigger.

---

## Key types & terms

| Name | Meaning |
|---|---|
| `BlockRef` | `{ hash: string; number: number }` |
| `DecodedEvent` | `{ pallet, method, data }` decoded from a `System.Events` record |
| `PoolMutation<T>` | `{ address, apply: (pool) => pool }` — a targeted store patch |
| `PoolEventHandler<T>` | `{ match(e), resolve(e, block) → PoolMutation[] }` |
| `PoolEventEffect` | `{ match(e), apply(e, block) → void }` — side-effect, no store write |
| seed | first-emission `loadPools(block.hash)`; a full coherent snapshot |
| tick | per-block recompute for between-event drift (pegs, amp ramp) |
| reconcile | cadenced re-read of eventless interest-bearing reserves |
| backfill | replay of best-skipped canonical blocks via `parentHash` |
| reorg reread | re-run of buffered handlers at a new tip to heal orphaned-fork state |
| cursor | `block` / `blockHash`, set inside the commit |
```
