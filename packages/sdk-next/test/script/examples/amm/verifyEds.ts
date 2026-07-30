import { PolkadotClient } from 'polkadot-api';

import { Observable, Subscription } from 'rxjs';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { EvmClient } from '../../../../src/evm';
import { omni, stable, PoolBase } from '../../../../src/pool';

const DURATION_MS = 20 * 60 * 1000;

// Relative tolerance (ppm) for numeric fields — absorbs interest accrual on
// yield-bearing (aToken) reserves that drift every block with no event.
const YIELD_DRIFT_PPM = 100n; // 0.01%

const isInt = (s: string | undefined): s is string => !!s && /^-?\d+$/.test(s);

const { OmniPoolClient } = omni;
const { StableSwapClient } = stable;

/**
 * Test probes exposing the committed block cursor.
 *
 * - `blockNo` / `hash` are coherent with a `getSubscriber` emission (the
 *   driver commits and emits synchronously before advancing to the next block)
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
 * - Numeric fields within `YIELD_DRIFT_PPM` are treated as yield drift, not a
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
      // Only token reserve balances accrue yield; everything else is exact.
      if (k.endsWith('.balance') && ppm <= YIELD_DRIFT_PPM) {
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

const tally = (s: Stats) =>
  `ok=${s.ok} bad=${s.bad} drift=${s.drift} skip=${s.skip}`;

/**
 * Differential-check one pool client.
 *
 * - Subscribe to the consumer API; each emission is a full, committed snapshot
 * - Reload the same block on a pinned client and compare
 * - Log block + running stats; print field diffs only on mismatch
 */
const verify = <T extends PoolBase>(
  label: string,
  subscriber$: () => Observable<T[]>,
  blockNo: () => number,
  hash: () => string | undefined,
  ref: (at: string) => { getPools(): Promise<PoolBase[]> },
  stats: Stats
): Subscription => {
  let busy = false;
  return subscriber$().subscribe((snapshot) => {
    const at = hash();
    const no = blockNo();
    if (!at || busy) return; // seed emission, or a check still in flight
    busy = true;

    ref(at)
      .getPools()
      .then((actual) => {
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
    const omniStats: Stats = { checks: 0, ok: 0, bad: 0, drift: 0, skip: 0 };
    const stableStats: Stats = { checks: 0, ok: 0, bad: 0, drift: 0, skip: 0 };

    const omniLive = new OmniProbe(client, evm);
    const stableLive = new StableProbe(client, evm);

    const session = new Subscription();
    session.add(
      verify(
        'OMNI',
        () => omniLive.getSubscriber(),
        () => omniLive.blockNo(),
        () => omniLive.hash(),
        (at) => new OmniPoolClient(client, evm, at),
        omniStats
      )
    );
    session.add(
      verify(
        'STBL',
        () => stableLive.getSubscriber(),
        () => stableLive.blockNo(),
        () => stableLive.hash(),
        (at) => new StableSwapClient(client, evm, at),
        stableStats
      )
    );

    console.log(`Verifying for ${DURATION_MS / 60000} min...`);
    await new Promise((resolve) => setTimeout(resolve, DURATION_MS));

    session.unsubscribe();
    return { omni: omniStats, stable: stableStats };
  }
}

new VerifyEds(ApiUrl.Kril, 'Verify event-driven sync').run();
