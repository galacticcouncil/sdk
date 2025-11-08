import { AccountId, CompatibilityLevel } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { blake2b } from '@noble/hashes/blake2b';

import { Subscription, distinctUntilChanged, finalize, map, merge } from 'rxjs';

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
import { HYDRATION_SS58_PREFIX, RUNTIME_DECIMALS } from '@galacticcouncil/common';
import { fmt } from '../../utils';

import { StableMath } from './StableMath';
import { StableSwapBase, StableSwapFees } from './StableSwap';
import { TStableswap, TStableswapPeg } from './types';

const { FeeUtils } = fmt;

export class StableSwapClient extends PoolClient<StableSwapBase> {
  protected poolsData: Map<number, TStableswap> = new Map([]);

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
        this.api.query.Stableswap.AssetTradability.getValue(poolId, id),
        this.api.query.AssetRegistry.Assets.getValue(id),
        this.getBalance(poolAddress, id),
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

  async isSupported(): Promise<boolean> {
    const query = this.api.query.Stableswap.Pools;
    const compatibilityToken = await this.api.compatibilityToken;
    return query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      compatibilityToken
    );
  }

  protected async loadPools(): Promise<StableSwapBase[]> {
    const [pools, block, poolLimits] = await Promise.all([
      this.api.query.Stableswap.Pools.getEntries({ at: 'best' }),
      this.api.query.System.Number.getValue({ at: 'best' }),
      this.getPoolLimits(),
    ]);

    const entries = pools.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const address = this.getPoolAddress(id);
      const [tokens, pegs, issuance] = await Promise.all([
        this.getPoolTokens(id, value),
        this.api.query.Stableswap.PoolPegs.getValue(id, { at: 'best' }),
        this.api.query.Tokens.TotalIssuance.getValue(id, { at: 'best' }),
      ]);

      const poolAmplfication = this.getPoolAmplification(value, block);
      const poolPegs = pegs
        ? this.getRecentPegs(pegs)
        : this.getDefaultPegs(value);

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
        pegs: poolPegs,
        ...poolLimits,
        ...poolAmplfication,
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

  private getDefaultPegs(poolInfo: TStableswap): string[][] {
    return StableMath.defaultPegs(poolInfo.assets.length);
  }

  private getRecentPegs(peg: TStableswapPeg): string[][] {
    const { current } = peg;
    return Array.from(current.entries()).map(([_, prices]) =>
      prices.map((p) => p.toString())
    );
  }

  private subscribeIssuance(): Subscription {
    const pools = this.store.pools;

    const streams = pools
      .map((p) => p.id)
      .map((id) =>
        this.api.query.Tokens.TotalIssuance.watchValue(id, 'best').pipe(
          map((value) => ({
            id,
            value,
          }))
        )
      );

    return merge(...streams)
      .pipe(
        finalize(() => {
          this.log(this.getPoolType(), 'unsub total issuance');
        })
      )
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
        finalize(() => {
          this.log(this.getPoolType(), 'unsub pool pegs');
        })
      )
      .subscribe(({ deltas }) => {
        this.store.update((pools) => {
          const updated: StableSwapBase[] = [];
          const poolsMap = new Map(pools.map((p) => [p.id, p]));

          deltas?.upserted.forEach(({ args, value }) => {
            const [key] = args;

            const pool = poolsMap.get(key);
            if (pool) {
              const pegs = this.getRecentPegs(value);
              updated.push({
                ...pool,
                pegs: pegs,
              });
            }
          });
          return updated;
        });
      });
  }

  private subscribeBlock(): Subscription {
    return this.api.query.System.Number.watchValue('best')
      .pipe(
        finalize(() => {
          this.log(this.getPoolType(), 'unsub block change');
        })
      )
      .subscribe((block) => {
        this.store.update((pools) => {
          const updated: StableSwapBase[] = [];
          pools
            .filter((pool) => pool.isRampPeriod)
            .forEach((pool) => {
              const data = this.poolsData.get(pool.id);
              if (data) {
                const amplification = this.getPoolAmplification(data, block);
                updated.push({
                  ...pool,
                  ...amplification,
                });
              }
            });
          return updated;
        });
      });
  }

  protected subscribeUpdates(): Subscription {
    const sub = new Subscription();

    sub.add(this.subscribePoolPegs());
    sub.add(this.subscribeIssuance());

    const hasOnRamps = this.hasOnRamps();
    if (hasOnRamps) {
      sub.add(this.subscribeBlock());
    }

    return sub;
  }

  private hasOnRamps() {
    return this.store.pools.filter((p) => p.isRampPeriod).length > 0;
  }
}
