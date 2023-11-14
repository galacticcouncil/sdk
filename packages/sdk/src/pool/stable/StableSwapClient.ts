import type { PalletStableswapPoolInfo } from '@polkadot/types/lookup';
import { blake2AsHex, encodeAddress } from '@polkadot/util-crypto';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { HYDRADX_OMNIPOOL_ADDRESS, HYDRADX_SS58_PREFIX } from '../../consts';
import {
  PoolBase,
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
} from '../../types';
import { toPoolFee } from '../../utils/mapper';

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

        const [poolDelta, poolTokens] = await Promise.all([
          this.getPoolDelta(poolId, pool, blockNumber.toString()),
          this.getPoolTokens(poolAddress, poolId, pool),
        ]);

        this.stablePools.set(poolAddress, pool);
        return {
          address: poolAddress,
          id: poolId,
          type: PoolType.Stable,
          fee: toPoolFee(pool.fee.toNumber()),
          tokens: poolTokens,
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

  async subscribePoolChange(pool: PoolBase): UnsubscribePromise {
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
      } as StableSwapBase;
    });
  }

  private async getPoolDelta(
    poolId: string,
    poolInfo: PalletStableswapPoolInfo,
    blockNumber: string
  ): Promise<Partial<StableSwapBase>> {
    const {
      initialAmplification,
      finalAmplification,
      initialBlock,
      finalBlock,
    } = poolInfo;

    const amplification = StableMath.calculateAmplification(
      initialAmplification.toString(),
      finalAmplification.toString(),
      initialBlock.toString(),
      finalBlock.toString(),
      blockNumber
    );

    const totalIssuance = await this.api.query.tokens.totalIssuance(poolId);
    return {
      amplification: amplification,
      totalIssuance: totalIssuance.toString(),
    } as Partial<StableSwapBase>;
  }

  private async getPoolTokens(
    poolAddress: string,
    poolId: string,
    poolInfo: PalletStableswapPoolInfo
  ): Promise<PoolToken[]> {
    const { assets } = poolInfo;

    const poolTokens = assets.map(async (a) => {
      const [tradeability, balance] = await Promise.all([
        this.api.query.stableswap.assetTradability(poolId, a.toString()),
        this.getBalance(poolAddress, a.toString()),
      ]);

      return {
        id: a.toString(),
        tradeable: tradeability.bits.toNumber(),
        balance: balance.toString(),
      } as PoolToken;
    });

    const tokens = await Promise.all(poolTokens);

    const sharedAsset = await this.api.query.omnipool.assets(poolId);
    if (sharedAsset.isSome) {
      const { tradable } = sharedAsset.unwrap();
      const balance = await this.getBalance(HYDRADX_OMNIPOOL_ADDRESS, poolId);
      tokens.push({
        id: poolId,
        tradeable: tradable.bits.toNumber(),
        balance: balance.toString(),
      } as PoolToken);
    }
    return tokens;
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
