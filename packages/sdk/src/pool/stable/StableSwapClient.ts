import type {
  PalletEmaOracleOracleEntry,
  PalletStableswapPoolInfo,
  PalletStableswapPoolPegInfo,
} from '@polkadot/types/lookup';
import { blake2AsHex, encodeAddress } from '@polkadot/util-crypto';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { Option, u32 } from '@polkadot/types-codec';
import { ITuple } from '@polkadot/types-codec/types';

import { HYDRADX_OMNIPOOL_ADDRESS, HYDRADX_SS58_PREFIX } from '../../consts';
import {
  PoolBase,
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
  PoolPair,
} from '../../types';
import { toPoolFee } from '../../utils/mapper';

import { StableMath } from './StableMath';
import { StableSwapBase, StableSwapFees } from './StableSwap';

import { PoolClient } from '../PoolClient';

export class StableSwapClient extends PoolClient {
  private stablePools: Map<string, PalletStableswapPoolInfo> = new Map([]);

  isSupported(): boolean {
    return this.api.query.stableswap !== undefined;
  }

  isPegSupported(): boolean {
    return this.api.query.stableswap.poolPegs !== undefined;
  }

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

        const [poolDelta, poolTokens, poolPegs] = await Promise.all([
          this.getPoolDelta(poolId, pool, blockNumber.toString()),
          this.getPoolTokens(poolAddress, poolId, pool),
          this.getPoolPegs(poolId, pool, blockNumber.toString()),
        ]);

        this.stablePools.set(poolAddress, pool);
        return {
          address: poolAddress,
          id: poolId,
          type: PoolType.Stable,
          fee: toPoolFee(pool.fee.toNumber()),
          tokens: poolTokens,
          ...poolDelta,
          ...poolPegs,
          ...this.getPoolLimits(),
        } as PoolBase;
      }
    );
    return Promise.all(stablePools);
  }

  async getPoolFees(_poolPair: PoolPair, address: string): Promise<PoolFees> {
    const pool = this.pools.find(
      (pool) => pool.address === address
    ) as StableSwapBase;
    return {
      fee: pool.pegsFee as PoolFee,
    } as StableSwapFees;
  }

  getPoolType(): PoolType {
    return PoolType.Stable;
  }

  async subscribePoolChange(pool: PoolBase): UnsubscribePromise {
    return this.api.query.system.number(async (parachainBlock) => {
      const blockNumber = parachainBlock.toString();
      const stablePool = this.stablePools.get(pool.address);
      if (stablePool) {
        const [poolDelta, poolPegs] = await Promise.all([
          this.getPoolDelta(pool.id!, stablePool, blockNumber),
          this.getPoolPegs(pool.id!, stablePool, blockNumber),
        ]);
        Object.assign(pool, poolDelta, poolPegs);
      }
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

  private getPoolDefaultPegs(poolInfo: PalletStableswapPoolInfo) {
    const defaultFee = poolInfo.fee;
    const defaultPegs = StableMath.defaultPegs(poolInfo.assets.length);
    return {
      pegsFee: toPoolFee(defaultFee.toNumber()),
      pegs: defaultPegs,
    };
  }

  private async getPoolPegs(
    poolId: string,
    poolInfo: PalletStableswapPoolInfo,
    blockNumber: string
  ): Promise<Partial<StableSwapBase>> {
    if (!this.isPegSupported()) {
      return this.getPoolDefaultPegs(poolInfo);
    }

    const poolPegs = await this.api.query.stableswap.poolPegs(poolId);
    if (poolPegs.isNone) {
      return this.getPoolDefaultPegs(poolInfo);
    }

    const pegs = poolPegs.unwrap();

    const latestPegs = await this.getLatestPegs(poolInfo, pegs, blockNumber);
    const recentPegs = this.getRecentPegs(pegs);
    const maxPegUpdate = pegs.maxPegUpdate.toHuman();
    const fee = poolInfo.fee.toHuman();

    const [updatedFee, updatedPegs] = StableMath.recalculatePegs(
      JSON.stringify(recentPegs),
      JSON.stringify(latestPegs),
      blockNumber,
      maxPegUpdate.replace(/%/g, ''),
      fee.replace(/%/g, '')
    );

    const updatedFeePermill = Number(updatedFee) * 10000;
    return {
      pegsFee: toPoolFee(updatedFeePermill),
      pegs: updatedPegs,
    };
  }

  private getRecentPegs(poolPegs: PalletStableswapPoolPegInfo) {
    const { current } = poolPegs;
    return Array.from(current.entries()).map(([_, pegs]) =>
      pegs.map((p) => p.toString())
    );
  }

  private async getLatestPegs(
    poolInfo: PalletStableswapPoolInfo,
    poolPegs: PalletStableswapPoolPegInfo,
    blockNumber: string
  ) {
    const { source } = poolPegs;

    const assets = Array.from(poolInfo.assets.entries()).map(([_, id]) =>
      id.toString()
    );

    const latest = source.map(async (s, i) => {
      if (s.isOracle) {
        const [oracleName, oraclePeriod, oracleAsset] = s.asOracle;

        const oracleKey = [oracleAsset.toString(), assets[i]]
          .map((a) => Number(a))
          .sort((a, b) => a - b);

        const oracleEntry = await this.api.query.emaOracle.oracles<
          Option<ITuple<[PalletEmaOracleOracleEntry, u32]>>
        >(oracleName, oracleKey, oraclePeriod);
        const [{ price, updatedAt }] = oracleEntry.unwrap();

        const priceNum = price.n.toString();
        const priceDenom = price.d.toString();

        return oracleAsset.toString() === oracleKey[0].toString()
          ? [[priceNum, priceDenom], updatedAt.toString()]
          : [[priceDenom, priceNum], updatedAt.toString()];
      } else {
        return [s.asValue.map((p) => p.toString()), blockNumber];
      }
    });
    return Promise.all(latest);
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
