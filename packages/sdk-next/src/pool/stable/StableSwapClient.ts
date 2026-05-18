import { AccountId, CompatibilityLevel } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { blake2b } from '@noble/hashes/blake2b';

import {
  Subscription,
  distinctUntilChanged,
  filter,
  map,
  merge,
  tap,
} from 'rxjs';

import {
  HYDRATION_SS58_PREFIX,
  RUNTIME_DECIMALS,
} from '@galacticcouncil/common';

import {
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
  PoolPair,
} from '../types';
import { PoolClient } from '../PoolClient';

import { TRADEABLE_DEFAULT } from '../../consts';
import { fmt, QueryBus } from '../../utils';

import {
  DIA_MM_BY_KEY,
  HYBRID_MM_BY_EMA,
  HYBRID_MM_BY_EMITTER,
  MmOracleLog,
  MmOracleClient,
  MmOracleEntry,
  MmOracleEvent,
  emaRouteKey,
} from '../../oracle';

import { StableMath } from './StableMath';
import { StableSwapBase, StableSwapFees } from './StableSwap';
import { StableSwapPeg } from './StableSwapPeg';
import {
  TEmaName,
  TEmaOracle,
  TEmaPair,
  TEmaPeriod,
  TPegLatest,
  TStableswap,
  TStableswapPeg,
} from './types';

const { FeeUtils } = fmt;

const SYNC_MM_EVENTS = ['ManagedOracle.PriceUpdated', 'DIA.OracleUpdate'];

export class StableSwapClient extends PoolClient<StableSwapBase> {
  protected poolsData: Map<number, TStableswap> = new Map([]);

  private mmOracle = new MmOracleClient(this.evm);
  private mmAddresses: Set<string> = new Set();
  private mmRouting = {
    byEmitter: new Map<string, string>(),
    byDiaKey: new Map<string, string>(),
    byEma: new Map<string, string>(),
  };

  private queryBus = new QueryBus();

  private emaOracles = this.queryBus.scope<
    [TEmaName, TEmaPair, TEmaPeriod],
    TEmaOracle | undefined
  >(
    'EmaOracle.Oracles',
    (name, pair, period) =>
      this.api.query.EmaOracle.Oracles.getValue(name, pair, period, {
        at: this.at,
      }),
    (name, pair, period) =>
      `${name.toString()}:${pair.join(':')}:${period.type}`,
    6 * 1000
  );

  private mmOracles = this.queryBus.scope<[string], MmOracleEntry>(
    'MmOracle',
    (h160) => this.mmOracle.getData(h160),
    (h160) => h160.toLowerCase(),
    10 * 60 * 1000
  );

  private pegs = this.queryBus.scope<[number], TStableswapPeg | undefined>(
    'Stableswap.PoolPegs',
    (id) => this.api.query.Stableswap.PoolPegs.getValue(id, { at: this.at }),
    (id) => String(id),
    6 * 1000
  );

  getPoolType(): PoolType {
    return PoolType.Stable;
  }

  private getPoolAddress(poolId: number) {
    const name = StableMath.getPoolAddress(poolId);
    const blake2 = blake2b(name, { dkLen: 32 });
    const blake2Hex = toHex(blake2);
    return AccountId(HYDRATION_SS58_PREFIX).dec(blake2Hex);
  }

  private async getPoolLimits(): Promise<PoolLimits> {
    const minTradingLimit =
      await this.api.constants.Stableswap.MinTradingLimit();

    return {
      maxInRatio: 0n,
      maxOutRatio: 0n,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }

  private getPoolAmplification(
    poolInfo: TStableswap,
    blockNumber: number
  ): Pick<StableSwapBase, 'amplification' | 'isRampPeriod'> {
    const {
      initial_amplification,
      final_amplification,
      initial_block,
      final_block,
    } = poolInfo;

    const amplification = StableMath.calculateAmplification(
      initial_amplification.toString(),
      final_amplification.toString(),
      initial_block.toString(),
      final_block.toString(),
      blockNumber.toString()
    );

    const isRampPeriod = Number(amplification) < final_amplification;
    return {
      amplification: BigInt(amplification),
      isRampPeriod: isRampPeriod,
    } as Pick<StableSwapBase, 'amplification' | 'isRampPeriod'>;
  }

  private async getPoolTokens(
    poolId: number,
    poolInfo: TStableswap
  ): Promise<PoolToken[]> {
    const poolAddress = this.getPoolAddress(poolId);
    const poolTokens = poolInfo.assets.map(async (id) => {
      const [tradeability, meta, balance] = await Promise.all([
        this.api.query.Stableswap.AssetTradability.getValue(poolId, id, {
          at: this.at,
        }),
        this.api.query.AssetRegistry.Assets.getValue(id, { at: this.at }),
        this.balance.getBalance(poolAddress, id),
      ]);

      return {
        id: id,
        decimals: meta?.decimals,
        existentialDeposit: meta?.existential_deposit,
        balance: balance.transferable,
        tradeable: tradeability,
        type: meta?.asset_type.type,
      } as PoolToken;
    });

    return Promise.all(poolTokens);
  }

  private buildRouting(): void {
    this.mmRouting.byEmitter.clear();
    this.mmRouting.byDiaKey.clear();
    this.mmRouting.byEma.clear();

    // Managed direct: emitter is itself the mmAddress.
    for (const mm of this.mmAddresses) {
      this.mmRouting.byEmitter.set(mm, mm);
    }

    // Hybrid: wrapped Managed emitter → hybrid mmAddress.
    for (const [emitter, hybridMm] of Object.entries(HYBRID_MM_BY_EMITTER)) {
      const e = emitter.toLowerCase();
      const m = hybridMm.toLowerCase();
      if (this.mmAddresses.has(m)) this.mmRouting.byEmitter.set(e, m);
    }

    // DIA wrapper: OracleUpdate key → mmAddress.
    for (const [key, mm] of Object.entries(DIA_MM_BY_KEY)) {
      const m = mm.toLowerCase();
      if (this.mmAddresses.has(m)) this.mmRouting.byDiaKey.set(key, m);
    }

    // Hybrid EMA leg: `${source}:${pairA}:${pairB}` → hybrid mmAddress.
    for (const [key, mm] of Object.entries(HYBRID_MM_BY_EMA)) {
      const m = mm.toLowerCase();
      if (this.mmAddresses.has(m)) this.mmRouting.byEma.set(key, m);
    }
  }

  async isSupported(): Promise<boolean> {
    const staticApis = await this.api.getStaticApis();
    return staticApis.compat.query.Stableswap.Pools.isCompatible(
      CompatibilityLevel.BackwardsCompatible
    );
  }

  protected async loadPools(): Promise<StableSwapBase[]> {
    const [pools, pegs, block, poolLimits] = await Promise.all([
      this.api.query.Stableswap.Pools.getEntries({ at: this.at }),
      this.api.query.Stableswap.PoolPegs.getEntries({ at: this.at }),
      this.api.query.System.Number.getValue({ at: this.at }),
      this.getPoolLimits(),
    ]);

    for (const { keyArgs, value } of pegs) {
      const [id] = keyArgs;
      this.pegs.set(value, id);
      for (const s of value.source) {
        if (s.type === 'MMOracle') {
          this.mmAddresses.add(s.value.toString().toLowerCase());
        }
      }
    }

    this.buildRouting();

    const entries = pools.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const address = this.getPoolAddress(id);
      const [tokens, amplification, pegs, issuance] = await Promise.all([
        this.getPoolTokens(id, value),
        this.getPoolAmplification(value, block),
        this.getPoolPegs(id, value, block),
        this.api.query.Tokens.TotalIssuance.getValue(id, { at: this.at }),
      ]);

      // add virtual share (routing)
      tokens.push({
        id: id,
        tradeable: TRADEABLE_DEFAULT,
        balance: issuance,
        decimals: RUNTIME_DECIMALS,
      } as PoolToken);

      this.poolsData.set(id, value);
      return {
        address: address,
        id: id,
        type: PoolType.Stable,
        fee: FeeUtils.fromPermill(value.fee),
        tokens: tokens,
        totalIssuance: issuance,
        ...pegs,
        ...poolLimits,
        ...amplification,
      } as StableSwapBase;
    });

    return Promise.all(entries);
  }

  async getPoolFees(_pair: PoolPair, address: string): Promise<PoolFees> {
    const pool = this.store.pools.find(
      (pool) => pool.address === address
    ) as StableSwapBase;

    return {
      fee: pool.fee as PoolFee,
    } as StableSwapFees;
  }

  private async getPoolPegs(
    poolId: number,
    pool: TStableswap,
    blockNumber: number
  ) {
    const poolPegs = await this.pegs.get(poolId);
    if (!poolPegs) {
      return StableSwapPeg.getDefault(pool);
    }
    const latest = await this.getLatestPegs(pool, poolPegs, blockNumber);
    return StableSwapPeg.compute(pool, poolPegs, latest, blockNumber);
  }

  private async getLatestPegs(
    pool: TStableswap,
    poolPegs: TStableswapPeg,
    blockNumber: number
  ): Promise<TPegLatest[]> {
    const { source } = poolPegs;
    const assets = pool.assets;

    const latest = source.map(async (s, i) => {
      if (s.type === 'Oracle') {
        const [name, period, oracleAsset] = s.value as [
          TEmaName,
          TEmaPeriod,
          number,
        ];
        const oracleKey = [oracleAsset, assets[i]].sort((a, b) => a - b) as [
          number,
          number,
        ];
        const entry = await this.emaOracles.get(name, oracleKey, period);
        if (!entry) {
          throw new Error('EmaOracle missing for ' + name + ' / ' + oracleKey);
        }
        const [{ price, updated_at }] = entry;
        const pair =
          oracleAsset === oracleKey[0]
            ? [price.n.toString(), price.d.toString()]
            : [price.d.toString(), price.n.toString()];
        return { pair, updatedAt: updated_at.toString(), source: s.type };
      }

      if (s.type === 'MMOracle') {
        const h160 = s.value.toString();
        const { price, decimals, updatedAt } = await this.mmOracles.get(h160);
        const priceDenom = (10n ** BigInt(decimals)).toString();
        const pair = [price.toString(), priceDenom];
        return { pair, updatedAt: updatedAt.toString(), source: s.type };
      }

      if (s.type === 'Value') {
        const pair = (s.value as [bigint, bigint]).map((p) => p.toString());
        return { pair, updatedAt: blockNumber.toString() };
      }

      throw new Error(s + ' source not supported');
    });

    return Promise.all(latest);
  }

  private subscribeIssuance(): Subscription {
    const pools = this.store.pools;

    const streams = pools
      .map((p) => p.id)
      .map((id) =>
        this.api.query.Tokens.TotalIssuance.watchValue(id, {
          at: 'best',
        }).pipe(
          map(({ value }) => value),
          map((value, index) => ({ value, index })),
          tap(({ index, value }) => {
            if (index > 0) {
              this.log.trace('tokens.TotalIssuance', id, value);
            }
          }),
          map(({ value }) => ({
            id,
            value,
          }))
        )
      );

    return merge(...streams)
      .pipe(this.watchGuard('tokens.TotalIssuance'))
      .subscribe((delta) => {
        const { id, value } = delta;

        this.store.update((pools) => {
          const updated: StableSwapBase[] = [];
          pools
            .filter((pool) => pool.id === id)
            .forEach((pool) => {
              const tokens = pool.tokens.map((t) => {
                if (t.id === id) {
                  return {
                    ...t,
                    balance: value,
                  };
                }
                return t;
              });

              updated.push({
                ...pool,
                tokens: tokens,
                totalIssuance: value,
              });
            });
          return updated;
        });
      });
  }

  private subscribePoolPegs(): Subscription {
    return this.api.query.Stableswap.PoolPegs.watchEntries({
      at: 'best',
    })
      .pipe(
        distinctUntilChanged((_, current) => !current.deltas),
        map((value, index) => ({ value, index })),
        tap(({ value, index }) => {
          if (index > 0) {
            this.log.trace('stableswap.PoolPegs', value.deltas?.upserted);
          }
        }),
        this.watchGuard('stableswap.PoolPegs')
      )
      .subscribe({
        error: (e) => this.log.error('stableswap.PoolPegs', e),
        next: ({ value: { deltas } }) => {
          for (const { args, value } of deltas?.upserted ?? []) {
            const [key] = args;
            this.pegs.set(value, key);
          }
        },
      });
  }

  private subscribeEmaOracles(): Subscription {
    return this.api.query.EmaOracle.Oracles.watchEntries({ at: 'best' })
      .pipe(
        distinctUntilChanged((_, current) => !current.deltas),
        map((value, index) => ({ value, index })),
        tap(({ value, index }) => {
          if (index > 0) {
            this.log.trace('emaOracle.Oracles', value.deltas?.upserted);
          }
        }),
        this.watchGuard('emaOracle.Oracles')
      )
      .subscribe(async ({ value: { deltas } }) => {
        const hybridTargets = new Set<string>();
        for (const { args, value } of deltas?.upserted ?? []) {
          const [name, pair, period] = args;
          this.emaOracles.set(value, name, pair, period);

          const mmEmaKey = emaRouteKey(name, pair, period.type);
          const mm = this.mmRouting.byEma.get(mmEmaKey);
          if (mm) hybridTargets.add(mm);
        }

        for (const h160 of hybridTargets) {
          const fresh = await this.mmOracle.getData(h160);
          console.log('Debug EMA:', h160, fresh);

          this.mmOracles.set(fresh, h160);
        }
      });
  }

  private subscribeMMOracles(): Subscription {
    return this.api.event.EVM.Log.watch()
      .pipe(
        map(({ events }) =>
          events
            .map((e) => MmOracleLog.parse(e.payload))
            .filter((v): v is MmOracleEvent => !!v)
            .filter(({ eventName }) => SYNC_MM_EVENTS.includes(eventName))
        ),
        filter((parsed) => parsed.length > 0),
        this.watchGuard('evm.Log')
      )
      .subscribe(async (parsed) => {
        const targets = new Set<string>();
        for (const ev of parsed) {
          console.log(ev);
          if (ev.eventName === 'ManagedOracle.PriceUpdated') {
            const t = this.mmRouting.byEmitter.get(ev.emitter);
            if (t) targets.add(t);
          }
          if (ev.eventName === 'DIA.OracleUpdate' && ev.key) {
            const t = this.mmRouting.byDiaKey.get(ev.key);
            if (t) targets.add(t);
          }
        }

        this.log.trace('evm.Log', [...targets]);
        for (const h160 of targets) {
          const fresh = await this.mmOracle.getData(h160);
          console.log('Debug:', h160, fresh);
          this.mmOracles.set(fresh, h160);
        }
      });
  }

  private subscribeBlock(): Subscription {
    return this.watcher.bestBlock$
      .pipe(this.watchGuard('watcher.bestBlock'))
      .subscribe((block) => {
        this.store.update(async (pools) => {
          const updated: StableSwapBase[] = [];
          for (const pool of pools) {
            const data = this.poolsData.get(pool.id);
            if (data) {
              const pegs = await this.getPoolPegs(pool.id, data, block);
              const amplification = this.getPoolAmplification(data, block);
              updated.push({ ...pool, ...pegs, ...amplification });
            }
          }
          return updated;
        });
      });
  }

  protected subscribeUpdates(): Subscription {
    const sub = new Subscription();

    sub.add(this.subscribePoolPegs());
    sub.add(this.subscribeEmaOracles());
    sub.add(this.subscribeMMOracles());
    sub.add(this.subscribeIssuance());
    sub.add(this.subscribeBlock());

    return sub;
  }
}
