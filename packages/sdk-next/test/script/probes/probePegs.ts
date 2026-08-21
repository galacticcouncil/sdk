import { PolkadotClient } from 'polkadot-api';
import { hydration } from '@galacticcouncil/descriptors';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { EvmClient } from '../../../src/evm';
import { stable } from '../../../src/pool';
import {
  MmOracleClient,
  TEmaName,
  TEmaPair,
  TEmaPeriod,
} from '../../../src/oracle';

const DURATION_MS = 30 * 60 * 1000;

const { StableSwapClient } = stable;

/**
 * Exposes what the peg computation reads.
 *
 * - `pegs` is the on-chain anchor, live-backed and refreshed by the peg effects
 * - `emaOracles` is the target, live-backed and refreshed by the EMA effect
 * - `poolsData` holds the pool config the key is built from
 */
class StableProbe extends StableSwapClient {
  blockNo() {
    return this.block;
  }
  hash() {
    return this.blockHash;
  }
  get cache() {
    return this.query;
  }
  get config() {
    return this.poolsData;
  }
}

const short = (v: string) => (v.length > 12 ? `${v.slice(0, 12)}…` : v);

/** Peg values are BigInt, so a plain stringify throws mid-log */
const json = (v: unknown) =>
  JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x));

/**
 * Which input makes a live peg differ from a fresh read.
 *
 * - Every block, for every peg source, compare what the live client would use
 *   against the chain at that same block
 * - Reports the first input that differs, so the cause is named rather than
 *   inferred from the computed peg
 */
class VerifyPegs extends PapiExecutor {
  async script(client: PolkadotClient, evm: EvmClient) {
    const api = client.getTypedApi(hydration);
    const live = new StableProbe(client, evm);

    /**
     * One reference client, reused.
     *
     * - It never receives events, so its live tier stays empty and every
     *   block-tier scope re-reads each check regardless
     * - Only the TTL'd MM oracle would go stale, and that is cleared per check
     * - A fresh client per block would re-read the whole asset registry every
     *   block, which is a storage iteration the node does not enjoy
     */
    const ref = new StableProbe(client, evm);

    const stats = {
      blocks: 0,
      checks: 0,
      /** The symptom: computed pegs differing from a fresh load */
      diverged: 0,
      /** The inputs, so a divergence says which one caused it */
      height: 0,
      anchor: 0,
      ema: 0,
      mm: 0,
      fee: 0,
      config: 0,
      errors: 0,
    };

    const compare = async (at: string, block: number, changed: number) => {
      stats.blocks++;
      if (stats.blocks % 25 === 0) {
        console.log(`#${block} changed=${changed} ${JSON.stringify(stats)}`);
      }

      /**
       * The symptom: the same block loaded without any event-written state.
       * Only when the pegs differ are the inputs worth dumping.
       */
      ref.cache.mmOracles.clear();
      const loaded = await ref.getPools(at);
      const diverged = new Set<number>();

      /** The other half of the clamp: both sides must compute at the same height */
      if (ref.blockNo() !== block) {
        stats.height++;
        console.log(
          `#${block} HEIGHT live=${block} ref=${ref.blockNo()} at=${short(at)}`
        );
      }

      for (const pool of live.pools) {
        const other = loaded.find((p) => p.id === pool.id);
        if (!other) continue;

        if (json(pool.pegs) !== json(other.pegs)) {
          stats.diverged++;
          diverged.add(pool.id);
          console.log(
            `#${block} pool=${pool.id} PEGS live=${json(pool.pegs)} ref=${json(other.pegs)}`
          );
        }
      }

      for (const pool of live.pools) {
        const id = pool.id;

        /** The anchor: what the tick projects from */
        const [cached, fresh] = await Promise.all([
          live.cache.pegs.get(at, id),
          api.query.Stableswap.PoolPegs.getValue(id, { at }),
        ]);

        if (!cached || !fresh) continue;
        stats.checks++;

        const same = (a: unknown, b: unknown) => json(a) === json(b);

        /**
         * The whole struct feeds the clamp — `current`, `updated_at` and
         * `max_peg_update` — so compare all of it rather than a field or two
         */
        if (!same(cached, fresh)) {
          stats.anchor++;
          console.log(
            `#${block} pool=${id} ANCHOR live=${json(cached)} fresh=${json(fresh)}`
          );
        }

        /** The pool config the oracle key is built from */
        const config = live.config.get(id);
        const onChain = await api.query.Stableswap.Pools.getValue(id, { at });
        if (config && onChain && !same(config.assets, onChain.assets)) {
          stats.config++;
          console.log(
            `#${block} pool=${id} CONFIG assets live=${json(config.assets)} fresh=${json(onChain.assets)}`
          );
        }

        /** `fee` feeds recalculatePegs, and live patches it from an event */
        if (config && onChain && config.fee !== onChain.fee) {
          stats.fee++;
          console.log(
            `#${block} pool=${id} FEE live=${config.fee} fresh=${onChain.fee}`
          );
        }

        const assets = config?.assets ?? [];

        /** The target: every Oracle source's entry, live against fresh */
        await Promise.all(
          fresh.source.map(async (s, i) => {
            /**
             * MM prices are read over EVM with no block tag, so a fresh client
             * reads latest while live uses what its last event wrote. A
             * difference here is expected, and makes an exact peg comparison
             * impossible for an MM-pegged pool.
             */
            if (s.type === 'MMOracle') {
              const h160 = s.value.toString();
              const [cachedMm, freshMm] = await Promise.all([
                live.cache.mmOracles.get(at, h160),
                new MmOracleClient(evm).getData(h160),
              ]);

              if (cachedMm.price === freshMm.price) return;

              stats.mm++;
              console.log(
                `#${block} pool=${id} src=${i} MM ${short(h160)}\n` +
                  `   live  price=${cachedMm.price} decimals=${cachedMm.decimals} updatedAt=${cachedMm.updatedAt}\n` +
                  `   fresh price=${freshMm.price} decimals=${freshMm.decimals} updatedAt=${freshMm.updatedAt}`
              );
              return;
            }

            if (s.type !== 'Oracle') return;

            const [name, period, oracleAsset] = s.value as [
              TEmaName,
              TEmaPeriod,
              number,
            ];
            const key = [oracleAsset, assets[i]].sort((a, b) => a - b) as [
              number,
              number,
            ];

            const [cachedEma, freshEma] = await Promise.all([
              live.cache.emaOracles.get(at, name, key as TEmaPair, period),
              api.query.EmaOracle.Oracles.getValue(
                name,
                key as TEmaPair,
                period,
                { at }
              ),
            ]);

            if (!cachedEma || !freshEma) return;

            const [c] = cachedEma;
            const [f] = freshEma;

            /**
             * `updated_at` is part of the clamp input, and it advances whenever
             * the oracle is touched even if the price comes out identical — so
             * an older entry moves the peg further, not less
             */
            if (
              c.price.n === f.price.n &&
              c.price.d === f.price.d &&
              c.updated_at === f.updated_at
            ) {
              return;
            }

            stats.ema++;
            console.log(
              `#${block} pool=${id} src=${i} EMA ${short(String(name))}:${key.join('/')}:${period.type}\n` +
                `   live  n=${c.price.n} d=${c.price.d} updated_at=${c.updated_at}\n` +
                `   fresh n=${f.price.n} d=${f.price.d} updated_at=${f.updated_at}\n` +
                `   ratio live=${Number(c.price.n) / Number(c.price.d)} fresh=${Number(f.price.n) / Number(f.price.d)}`
            );
          })
        );
      }
    };

    const sub = live.getSubscriber().subscribe((pools) => {
      const at = live.hash();
      const block = live.blockNo();
      if (!at) return;

      /** A throw here would otherwise vanish, and silence would prove nothing */
      compare(at, block, pools.length).catch((e: Error) => {
        stats.errors++;
        console.log(`#${block} ERROR ${e.message}`);
      });
    });

    console.log(`Comparing peg inputs for ${DURATION_MS / 60000} min...`);
    await new Promise((resolve) => setTimeout(resolve, DURATION_MS));
    sub.unsubscribe();

    return stats;
  }
}

new VerifyPegs(ApiUrl.Catfish1, 'Verify peg inputs, live vs fresh').run();
