import type { PalletStableswapPoolInfo } from '@polkadot/types/lookup';
import { blake2AsHex, encodeAddress } from '@polkadot/util-crypto';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { HYDRADX_SS58_PREFIX } from '../../consts';
import {
  PoolBase,
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
} from '../../types';

import { StableMath } from './StableMath';
import { StableSwapBase, StableSwapFees } from './StableSwap';

import { PoolClient } from '../PoolClient';

export class StableSwapClient extends PoolClient {
  private stablePools: Map<string, PalletStableswapPoolInfo> = new Map([]);

  async loadPools(): Promise<PoolBase[]> {
    const [pools, parachainBlock] = await Promise.all([
      this.api.query.stableswap.pools.entries(),
      this.api.query.system.number(),
    ]);

    const blockNumber = parachainBlock.toNumber();
    const stablePools = pools.map(
      async ([
        {
          args: [id],
        },
        state,
      ]) => {
        const pool: PalletStableswapPoolInfo = state.unwrap();
        const poolId = id.toString();
        const poolAddress = this.getPoolAddress(poolId);

        const poolDelta = await this.getPoolDelta(
          poolId,
          pool,
          blockNumber.toString()
        );

        this.stablePools.set(poolAddress, pool);
        return {
          address: poolAddress,
          id: poolId,
          type: PoolType.Stable,
          fee: pool.fee.toJSON() as PoolFee,
          ...poolDelta,
          ...this.getPoolLimits(),
        } as PoolBase;
      }
    );
    return Promise.all(stablePools);
  }

  async getPoolFees(_feeAsset: string, address: string): Promise<PoolFees> {
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

  async subscribe(pool: PoolBase): UnsubscribePromise {
    return this.api.query.system.number(async (parachainBlock) => {
      const blockNumber = parachainBlock.toNumber();
      const stablePool = this.stablePools.get(pool.address);
      const poolDelta = await this.getPoolDelta(
        pool.id!,
        stablePool!,
        blockNumber.toString()
      );
      pool = {
        ...pool,
        ...poolDelta,
      };
    });
  }

  private async getPoolDelta(
    poolId: string,
    poolInfo: PalletStableswapPoolInfo,
    blockNumber: string
  ): Promise<Partial<PoolBase>> {
    const {
      initialAmplification,
      finalAmplification,
      initialBlock,
      finalBlock,
      assets,
    } = poolInfo;

    const amplification = StableMath.calculateAmplification(
      initialAmplification.toString(),
      finalAmplification.toString(),
      initialBlock.toString(),
      finalBlock.toString(),
      blockNumber
    );

    const [sharedAsset, totalIssuance] = await Promise.all([
      this.api.query.omnipool.assets(poolId),
      this.api.query.tokens.totalIssuance(poolId),
    ]);

    const poolTokens = assets.map(async (a) => {
      const tradeability = await this.api.query.stableswap.assetTradability(
        poolId,
        a.toString()
      );
      return {
        id: a.toString(),
        tradeable: tradeability.bits.toNumber(),
      } as PoolToken;
    });

    const tokens = await Promise.all(poolTokens);
    if (sharedAsset.isSome) {
      const { tradable } = sharedAsset.unwrap();
      tokens.push({
        id: poolId,
        tradeable: tradable.bits.toNumber(),
      } as PoolToken);
    }

    return {
      amplification: amplification,
      totalIssuance: totalIssuance.toString(),
      tokens: tokens,
    } as Partial<PoolBase>;
  }

  private getPoolAddress(poolId: string) {
    const pool = Number(poolId);
    const name = StableMath.getPoolAddress(pool);
    return encodeAddress(blake2AsHex(name), HYDRADX_SS58_PREFIX);
  }

  private getPoolLimits(): PoolLimits {
    const minTradingLimit =
      this.api.consts.stableswap.minTradingLimit.toJSON() as number;
    return {
      maxInRatio: 0,
      maxOutRatio: 0,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }
}
