import { PolkadotClient } from 'polkadot-api';

import { Observable, Subscription } from 'rxjs';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { EvmClient } from '../../../src/evm';
import { omni, stable, xyk, aave, hsm, PoolBase } from '../../../src/pool';

const DURATION_MS = 65 * 60 * 1000;

// Relative tolerance (ppm) for fields that converge every block from event-cached
// inputs — yield-bearing (aToken) reserve balances and oracle-driven pegs. The
// event-driven store tracks these from caches refreshed on events, so it lags a
// fresh per-block reload by a bounded, sub-ppm amount.
const DRIFT_PPM = 100n; // 0.01%

const isInt = (s: string | undefined): s is string => !!s && /^-?\d+$/.test(s);

/**
 * The two things that converge, counted apart.
 *
 * - `pegs` trails its oracle target between refreshes
 * - `balance` is an interest-bearing reserve accruing with no event
 */
type DriftKind = 'pegs' | 'balance';

const DRIFT_KINDS: DriftKind[] = ['pegs', 'balance'];

/** Fields counted, and the worst relative delta seen, for one key */
type DriftEntry = { n: number; ppm: number };

/**
 * One kind's tally.
 *
 * - `by` is keyed by whoever owns the drifting field: the asset id for a
 *   balance, the pool id for a peg
 */
type DriftTally = { n: number; by: Record<string, DriftEntry> };

type Drift = Record<DriftKind, DriftTally>;

const newDrift = (): Drift => ({
  pegs: { n: 0, by: {} },
  balance: { n: 0, by: {} },
});

/** Merge one entry, keeping the count and the worst ppm */
const mergeEntry = (into: DriftTally, key: string, e: DriftEntry) => {
  const cur = (into.by[key] ??= { n: 0, ppm: 0 });
  cur.n += e.n;
  cur.ppm = Math.max(cur.ppm, e.ppm);
};

const addDrift = (into: Drift, from: Drift) => {
  for (const kind of DRIFT_KINDS) {
    into[kind].n += from[kind].n;
    for (const [key, e] of Object.entries(from[kind].by)) {
      mergeEntry(into[kind], key, e);
    }
  }
};

const hitDrift = (d: Drift, kind: DriftKind, key: string, ppm: bigint) => {
  d[kind].n++;
  mergeEntry(d[kind], key, { n: 1, ppm: Number(ppm) });
};

// Flattened keys whose per-block convergence is expected drift, not a mismatch.
// Only interest-bearing (Erc20/aToken) balances accrue without an event — a
// plain token balance is event-driven and pinned on both sides, so it must be
// EXACT. Pegs converge every block by design.
const driftKind = (
  k: string,
  view: Record<string, string>
): { kind: DriftKind; key: string } | undefined => {
  // Pegs belong to the pool, not to one asset
  if (k.startsWith('pegs.')) {
    return { kind: 'pegs', key: view['id'] ?? view['address'] };
  }

  const isYieldBearing = (id: string) => view[`tokens.${id}.type`] === 'Erc20';

  // HSM collateral held at the facilitator
  if (k === 'collateralBalance') {
    const id = view['collateralId'];
    return isYieldBearing(id) ? { kind: 'balance', key: id } : undefined;
  }

  const token = k.match(/^tokens\.(\d+)\.balance$/);
  if (token && isYieldBearing(token[1])) {
    return { kind: 'balance', key: token[1] };
  }
  return undefined;
};

const { OmniPoolClient } = omni;
const { StableSwapClient } = stable;
const { XykPoolClient } = xyk;
const { AavePoolClient } = aave;
const { HsmPoolClient } = hsm;

/**
 * Test probes exposing the committed block cursor and store.
 *
 * - `blockNo` / `hash` are coherent with a `getSubscriber` emission (the
 *   driver commits before advancing to the next block)
 */
class OmniProbe extends OmniPoolClient {
  blockNo() {
    return this.block;
  }
  hash() {
    return this.blockHash;
  }
}

class StableProbe extends StableSwapClient {
  blockNo() {
    return this.block;
  }
  hash() {
    return this.blockHash;
  }
}

class XykProbe extends XykPoolClient {
  blockNo() {
    return this.block;
  }
  hash() {
    return this.blockHash;
  }
}

class AaveProbe extends AavePoolClient {
  blockNo() {
    return this.block;
  }
  hash() {
    return this.blockHash;
  }
}

class HsmProbe extends HsmPoolClient {
  blockNo() {
    return this.block;
  }
  hash() {
    return this.blockHash;
  }
}

/**
 * Flatten a pool to `path -> scalar`, tokens keyed by id (order-independent).
 */
const flatten = (pool: PoolBase): Record<string, string> => {
  const out: Record<string, string> = {};
  const walk = (v: any, path: string) => {
    if (v === null || typeof v !== 'object') {
      out[path] = String(v);
    } else {
      for (const k of Object.keys(v)) walk(v[k], path ? `${path}.${k}` : k);
    }
  };
  const view = {
    ...pool,
    tokens: Object.fromEntries(pool.tokens.map((t) => [t.id, t])),
  };
  walk(view, '');
  return out;
};

/**
 * Field-level diffs between two pools.
 *
 * - Converging fields within `DRIFT_PPM` are treated as expected drift, not a
 *   mismatch (counted separately, per kind)
 * - Everything else is a real diff, reported with its relative delta
 */
const fieldDiffs = (l: PoolBase, r: PoolBase) => {
  const a = flatten(l);
  const b = flatten(r);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  const real: string[] = [];
  const drift = newDrift();
  for (const k of keys) {
    const av = a[k];
    const bv = b[k];
    if (av === bv) continue;

    if (isInt(av) && isInt(bv)) {
      const x = BigInt(av);
      const y = BigInt(bv);
      const ref = y < 0n ? -y : y;
      const d = x > y ? x - y : y - x;
      const ppm = ref === 0n ? 1_000_000n : (d * 1_000_000n) / ref;
      // Converging fields lag a fresh read by a bounded amount; the rest is exact.
      const hit = driftKind(k, b);
      if (hit && ppm <= DRIFT_PPM) {
        hitDrift(drift, hit.kind, hit.key, ppm);
        continue;
      }
      real.push(`${k}: ${av} → ${bv} (${ppm} ppm)`);
    } else {
      real.push(`${k}: ${av ?? '∅'} → ${bv ?? '∅'}`);
    }
  }
  return { real, drift };
};

/**
 * Identify a pool so a failure names it, not just its address.
 *
 * - `id` is what the chain keys a stableswap pool by, so it maps straight to
 *   `Stableswap.PoolPegs` / `Pools` when chasing a diverged input
 */
const identify = (pool: PoolBase): string => {
  const { id, type, address } = pool as PoolBase & { id?: number };
  return `${type}${id !== undefined ? ` id=${id}` : ''} ${address}`;
};

/**
 * Readable diffs between the live and reloaded state, per pool.
 */
const diff = (live: PoolBase[], ref: PoolBase[]) => {
  const liveByAddr = new Map(live.map((p) => [p.address, p]));
  const refByAddr = new Map(ref.map((p) => [p.address, p]));
  const addresses = new Set([...liveByAddr.keys(), ...refByAddr.keys()]);

  const pools: { pool: string; fields: string[] }[] = [];
  const drift = newDrift();
  for (const address of addresses) {
    const l = liveByAddr.get(address);
    const r = refByAddr.get(address);
    if (!l) {
      pools.push({ pool: identify(r!), fields: ['missing in live'] });
      continue;
    }
    if (!r) {
      pools.push({ pool: identify(l), fields: ['missing in ref'] });
      continue;
    }
    const { real, drift: d } = fieldDiffs(l, r);
    addDrift(drift, d);
    if (real.length) pools.push({ pool: identify(l), fields: real });
  }
  return { pools, drift };
};

type Stats = {
  checks: number;
  ok: number;
  bad: number;
  drift: Drift;
  skip: number;
};

const newStats = (): Stats => ({
  checks: 0,
  ok: 0,
  bad: 0,
  drift: newDrift(),
  skip: 0,
});

const tally = (s: Stats) =>
  `ok=${s.ok} bad=${s.bad} pegs=${s.drift.pegs.n} bal=${s.drift.balance.n} ` +
  `skip=${s.skip}`;

/**
 * Worst offenders for one kind, heaviest first.
 *
 * - `key` is the asset id for a balance, the pool id for a peg
 */
const offenders = (t: DriftTally): string =>
  Object.entries(t.by)
    .sort(([, a], [, b]) => b.n - a.n)
    .map(([key, e]) => `${key}: n=${e.n} max=${e.ppm}ppm`)
    .join('\n    ') || 'none';

/**
 * Differential-check one pool client.
 *
 * - Subscribe to the consumer API; each emission signals a commit
 * - Diff the FULL committed store (emissions carry only the changeset)
 *   against a reload of the same block on a pinned client
 * - `ref` builds a FRESH client per check: a reused instance would serve its
 *   TTL/persistent scopes (MM oracle, fee config) from cache and go blind to
 *   an update the live client picked up from an event
 * - Log block + running stats; print field diffs only on mismatch
 */
const verify = <T extends PoolBase>(
  label: string,
  subscriber$: () => Observable<T[]>,
  blockNo: () => number,
  hash: () => string | undefined,
  livePools: () => readonly T[],
  ref: (at: string) => Promise<PoolBase[]>,
  stats: Stats
): Subscription => {
  let busy = false;
  return subscriber$().subscribe(() => {
    const at = hash();
    const no = blockNo();
    if (!at || busy) return; // seed emission, or a check still in flight
    busy = true;

    const t0 = performance.now();
    const snapshot = [...livePools()];
    ref(at)
      .then(async (actual) => {
        stats.checks++;
        const ref = `ref=${Math.round(performance.now() - t0)}ms`;
        const { pools, drift } = diff(snapshot, actual);
        addDrift(stats.drift, drift);
        if (pools.length === 0) {
          stats.ok++;
          console.log(`[${label}] #${no} ✓ ${tally(stats)} ${ref}`);
        } else {
          stats.bad++;
          console.log(
            `[${label}] #${no} ✗ ${pools.length} pool(s) ${tally(stats)} ${ref}`
          );
          for (const p of pools) {
            console.log(`  ${p.pool}`);
            for (const f of p.fields) console.log(`    ${f}`);
          }
        }
      })
      .catch((e) => {
        stats.skip++;
        console.log(`[${label}] #${no} skip (${(e as Error).message})`);
      })
      .finally(() => {
        busy = false;
      });
  });
};

class VerifyEds extends PapiExecutor {
  async script(client: PolkadotClient, evm: EvmClient) {
    const stats = {
      omni: newStats(),
      stable: newStats(),
      xyk: newStats(),
      aave: newStats(),
      hsm: newStats(),
    };

    const omniLive = new OmniProbe(client, evm);
    const stableLive = new StableProbe(client, evm);
    const xykLive = new XykProbe(client, evm);
    const aaveLive = new AaveProbe(client, evm);
    const hsmLive = new HsmProbe(client, evm, stableLive);

    /**
     * Pinned reference loaders — a FRESH client per check, pinned at the
     * live cursor's block hash.
     *
     * - Never the live probes: `getPools` writes the store and cursor, so a
     *   shared instance would diff the store against itself
     * - Never reused across checks: TTL/persistent scopes (MM oracle, fee
     *   config) would serve a cached value and miss an update the live client
     *   picked up from an event
     * - HSM builds its own stableswap ref for that check, not a second live one
     */
    const session = new Subscription();

    session.add(
      verify(
        'OMNI',
        () => omniLive.getSubscriber(),
        () => omniLive.blockNo(),
        () => omniLive.hash(),
        () => omniLive.pools,
        (at) => new OmniPoolClient(client, evm, at).getPools(at),
        stats.omni
      )
    );
    session.add(
      verify(
        'STBL',
        () => stableLive.getSubscriber(),
        () => stableLive.blockNo(),
        () => stableLive.hash(),
        () => stableLive.pools,
        (at) => new StableSwapClient(client, evm, at).getPools(at),
        stats.stable
      )
    );
    // Heavy for no reason -> there is literally no traffic in XYKs now. Tested.
    //
    // session.add(
    //   verify(
    //     'XYK ',
    //     () => xykLive.getSubscriber(),
    //     () => xykLive.blockNo(),
    //     () => xykLive.hash(),
    //     () => xykLive.pools,
    //     (at) => new XykPoolClient(client, evm, at).getPools(at),
    //     stats.xyk
    //   )
    // );
    session.add(
      verify(
        'AAVE',
        () => aaveLive.getSubscriber(),
        () => aaveLive.blockNo(),
        () => aaveLive.hash(),
        () => aaveLive.pools,
        (at) => new AavePoolClient(client, evm, at).getPools(at),
        stats.aave
      )
    );
    session.add(
      verify(
        'HSM ',
        () => hsmLive.getSubscriber(),
        () => hsmLive.blockNo(),
        () => hsmLive.hash(),
        () => hsmLive.pools,
        (at) => {
          const stable = new StableSwapClient(client, evm, at);
          return new HsmPoolClient(client, evm, stable, at).getPools(at);
        },
        stats.hsm
      )
    );

    console.log(`Verifying for ${DURATION_MS / 60000} min...`);
    await new Promise((resolve) => setTimeout(resolve, DURATION_MS));

    session.unsubscribe();

    /** Who drifted, so a count turns into a named asset or pool */
    for (const [label, s] of Object.entries(stats)) {
      for (const kind of DRIFT_KINDS) {
        if (s.drift[kind].n === 0) continue;
        console.log(`[${label}] ${kind}\n    ${offenders(s.drift[kind])}`);
      }
    }

    return stats;
  }
}

new VerifyEds(ApiUrl.Catfish1, 'Verify event-driven sync').run();
