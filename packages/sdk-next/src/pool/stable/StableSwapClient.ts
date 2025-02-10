import { CompatibilityLevel } from 'polkadot-api';
import { HydrationQueries } from '@polkadot-api/descriptors';
import { blake2AsHex, encodeAddress } from '@polkadot/util-crypto';

import { type Observable, of, mergeMap, switchMap, NEVER } from 'rxjs';

import {
  PoolBase,
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
} from '../types';

import {
  HYDRATION_OMNIPOOL_ADDRESS,
  HYDRATION_SS58_PREFIX,
} from '../../consts';
import { fmt } from '../../utils';

import { StableMath } from './StableMath';
import { StableSwapBase, StableSwapFees } from './StableSwap';

import { PoolClient } from '../PoolClient';

type TStableswapPool = HydrationQueries['Stableswap']['Pools']['Value'];

export class StableSwapClient extends PoolClient {
  private stablePools: Map<string, TStableswapPool> = new Map([]);

  async isSupported(): Promise<boolean> {
    const query = this.api.query.Stableswap.Pools;
    const compatibilityToken = await this.api.compatibilityToken;
    return query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      compatibilityToken
    );
  }

  async loadPools(): Promise<PoolBase[]> {
    const [entries, parachainBlock] = await Promise.all([
      this.api.query.Stableswap.Pools.getEntries(),
      this.api.query.System.Number.getValue(),
    ]);

    const pools = entries.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const poolAddress = this.getPoolAddress(id);
      const [poolDelta, poolTokens] = await Promise.all([
        this.getPoolDelta(id, value, parachainBlock),
        this.getPoolTokens(poolAddress, id, value),
      ]);

      this.stablePools.set(poolAddress, value);
      return {
        address: poolAddress,
        id: id,
        type: PoolType.Stable,
        fee: fmt.toPoolFee(value.fee),
        tokens: poolTokens,
        ...poolDelta,
        ...this.getPoolLimits(),
      } as PoolBase;
    });
    return Promise.all(pools);
  }

  async getPoolFees(address: string, _feeAsset: number): Promise<PoolFees> {
    const pool = this.pools.find(
      (pool) => pool.address === address
    ) as StableSwapBase;

    return {
      fee: pool.fee as PoolFee,
    } as StableSwapFees;
  }

  getPoolType(): PoolType {
    return PoolType.Stable;
  }

  subscribePoolChange(pool: PoolBase): Observable<PoolBase> {
    const query = this.api.query.System.Number;
    const stablePool = this.stablePools.get(pool.address);

    if (!stablePool) {
      return NEVER;
    }

    return query.watchValue().pipe(
      switchMap((parachainBlock) =>
        this.getPoolDelta(pool.id!, stablePool, parachainBlock)
      ),
      mergeMap((delta) => {
        Object.assign(pool, delta);
        return of(pool);
      })
    );
  }

  private async getPoolDelta(
    poolId: number,
    poolInfo: TStableswapPool,
    blockNumber: number
  ): Promise<Partial<StableSwapBase>> {
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

    const query = this.api.query.Tokens.TotalIssuance;
    const totalIssuance = await query.getValue(poolId);
    return {
      amplification: BigInt(amplification),
      totalIssuance: totalIssuance,
    } as Partial<StableSwapBase>;
  }

  private async getPoolTokens(
    poolAddress: string,
    poolId: number,
    poolInfo: TStableswapPool
  ): Promise<PoolToken[]> {
    const { assets } = poolInfo;

    const poolTokens = assets.map(async (a) => {
      const [tradeability, balance] = await Promise.all([
        this.api.query.Stableswap.AssetTradability.getValue(poolId, a),
        this.getBalance(poolAddress, a),
      ]);

      return {
        id: a,
        tradeable: tradeability,
        balance: balance,
      } as PoolToken;
    });

    const tokens = await Promise.all(poolTokens);

    const sharedAsset = await this.api.query.Omnipool.Assets.getValue(poolId);
    if (sharedAsset) {
      const { tradable } = sharedAsset;
      const balance = await this.getBalance(HYDRATION_OMNIPOOL_ADDRESS, poolId);
      tokens.push({
        id: poolId,
        tradeable: tradable,
        balance: balance,
      } as PoolToken);
    }
    return tokens;
  }

  private getPoolAddress(poolId: number) {
    const name = StableMath.getPoolAddress(poolId);
    return encodeAddress(blake2AsHex(name), HYDRATION_SS58_PREFIX);
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
}
