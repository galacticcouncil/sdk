import { PolkadotClient } from 'polkadot-api';

import { Observable, Subscription } from 'rxjs';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { EvmClient } from '../../../src/evm';
import { omni, stable, xyk, aave, hsm, PoolBase } from '../../../src/pool';

const DURATION_MS = 20 * 60 * 1000;

// Feed every client follows. `finalized` is canonical, so it must produce ZERO
// reorgs — a reorg log there means the lineage classification is wrong, not
// that the chain forked. It exercises gap backfill instead (finality jumps).
const FOLLOW: 'best' | 'finalized' = 'best';

// Relative tolerance (ppm) for fields that converge every block from event-cached
// inputs — yield-bearing (aToken) reserve balances and oracle-driven pegs. The
// event-driven store tracks these from caches refreshed on events, so it lags a
// fresh per-block reload by a bounded, sub-ppm amount.
const DRIFT_PPM = 100n; // 0.01%

const isInt = (s: string | undefined): s is string => !!s && /^-?\d+$/.test(s);

// Flattened keys whose per-block convergence is expected drift, not a mismatch.
// Only interest-bearing (Erc20/aToken) balances accrue without an event — a
// plain token balance is event-driven and pinned on both sides, so it must be
// EXACT. Pegs converge every block by design.
const isDriftField = (k: string, view: Record<string, string>): boolean => {
  if (k.startsWith('pegs.')) return true;

  const isYieldBearing = (id: string) => view[`tokens.${id}.type`] === 'Erc20';

  // HSM collateral held at the facilitator
  if (k === 'collateralBalance') return isYieldBearing(view['collateralId']);

  const token = k.match(/^tokens\.(\d+)\.balance$/);
  return !!token && isYieldBearing(token[1]);
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
 *   mismatch (counted separately)
 * - Everything else is a real diff, reported with its relative delta
 */
const fieldDiffs = (l: PoolBase, r: PoolBase) => {
  const a = flatten(l);
  const b = flatten(r);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  const real: string[] = [];
  let drift = 0;
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
      if (isDriftField(k, b) && ppm <= DRIFT_PPM) {
        drift++;
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
 * Readable diffs between the live and reloaded state, per pool.
 */
const diff = (live: PoolBase[], ref: PoolBase[]) => {
  const liveByAddr = new Map(live.map((p) => [p.address, p]));
  const refByAddr = new Map(ref.map((p) => [p.address, p]));
  const addresses = new Set([...liveByAddr.keys(), ...refByAddr.keys()]);

  const pools: { address: string; fields: string[] }[] = [];
  let drift = 0;
  for (const address of addresses) {
    const l = liveByAddr.get(address);
    const r = refByAddr.get(address);
    if (!l) {
      pools.push({ address, fields: ['missing in live'] });
      continue;
    }
    if (!r) {
      pools.push({ address, fields: ['missing in ref'] });
      continue;
    }
    const { real, drift: d } = fieldDiffs(l, r);
    drift += d;
    if (real.length) pools.push({ address, fields: real });
  }
  return { pools, drift };
};

type Stats = {
  checks: number;
  ok: number;
  bad: number;
  drift: number;
  skip: number;
};

const newStats = (): Stats => ({ checks: 0, ok: 0, bad: 0, drift: 0, skip: 0 });

const tally = (s: Stats) =>
  `ok=${s.ok} bad=${s.bad} drift=${s.drift} skip=${s.skip}`;

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

    const snapshot = [...livePools()];
    ref(at)
      .then(async (actual) => {
        stats.checks++;
        const { pools, drift } = diff(snapshot, actual);
        stats.drift += drift;
        if (pools.length === 0) {
          stats.ok++;
          console.log(`[${label}] #${no} ✓ ${tally(stats)}`);
        } else {
          stats.bad++;
          console.log(
            `[${label}] #${no} ✗ ${pools.length} pool(s) ${tally(stats)}`
          );
          for (const p of pools) {
            console.log(`  ${p.address}`);
            for (const f of p.fields) console.log(`    ${f}`);
          }
        }
      })
      .catch((e) => {
        stats.skip++;
        console.log(`[${label}] #${no} · skip (${(e as Error).message})`);
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

    const omniLive = new OmniProbe(client, evm, FOLLOW);
    const stableLive = new StableProbe(client, evm, FOLLOW);
    const xykLive = new XykProbe(client, evm, FOLLOW);
    const aaveLive = new AaveProbe(client, evm, FOLLOW);
    const hsmLive = new HsmProbe(client, evm, stableLive, FOLLOW);

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
    session.add(
      verify(
        'XYK ',
        () => xykLive.getSubscriber(),
        () => xykLive.blockNo(),
        () => xykLive.hash(),
        () => xykLive.pools,
        (at) => new XykPoolClient(client, evm, at).getPools(at),
        stats.xyk
      )
    );
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
    return stats;
  }
}

new VerifyEds(ApiUrl.Catfish1, 'Verify event-driven sync').run();
