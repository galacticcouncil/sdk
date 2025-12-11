import type {
  PalletEmaOracleOracleEntry,
  PalletStableswapPoolInfo,
  PalletStableswapPoolPegInfo,
} from '@polkadot/types/lookup';
import { blake2AsHex, encodeAddress } from '@polkadot/util-crypto';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { Option, u32 } from '@polkadot/types-codec';
import { ITuple } from '@polkadot/types-codec/types';

import {
  HYDRADX_SS58_PREFIX,
  PERMILL_DENOMINATOR,
  TRADEABLE_DEFAULT,
} from '../../consts';
import { FeeUtils } from '../../utils/fee';

import {
  PoolBase,
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
  PoolPair,
} from '../types';
import { PoolClient } from '../PoolClient';

import { StableMath } from './StableMath';
import { StableSwapBase, StableSwapFees } from './StableSwap';

export class StableSwapClient extends PoolClient {
  private poolsData: Map<string, PalletStableswapPoolInfo> = new Map([]);

  getPoolType(): PoolType {
    return PoolType.Stable;
  }

  private getPoolAddress(poolId: string) {
    const pool = Number(poolId);
    const name = StableMath.getPoolAddress(pool);
    return encodeAddress(blake2AsHex(name), HYDRADX_SS58_PREFIX);
  }

  private getPoolLimits(): PoolLimits {
    const minTradingLimit =
      this.api.consts.stableswap.minTradingLimit.toNumber();
    return {
      maxInRatio: 0,
      maxOutRatio: 0,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }

  private async getPoolDelta(
    poolId: string,
    poolInfo: PalletStableswapPoolInfo,
    blockNumber: string
  ): Promise<Pick<StableSwapBase, 'amplification' | 'totalIssuance'>> {
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
    } as Pick<StableSwapBase, 'amplification' | 'totalIssuance'>;
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

    return Promise.all(poolTokens);
  }

  isSupported(): boolean {
    return this.api.query.stableswap !== undefined;
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
        try {
          const pool: PalletStableswapPoolInfo = state.unwrap();
          const poolId = id.toString();
          const poolAddress = this.getPoolAddress(poolId);

          const [poolDelta, poolTokens, poolPegs] = await Promise.all([
            this.getPoolDelta(poolId, pool, blockNumber.toString()),
            this.getPoolTokens(poolAddress, poolId, pool),
            this.getPoolPegs(poolId, pool, blockNumber.toString()),
          ]);

          // add virtual share (routing)
          poolTokens.push({
            id: poolId,
            tradeable: TRADEABLE_DEFAULT,
            balance: poolDelta.totalIssuance,
          } as PoolToken);

          this.poolsData.set(poolAddress, pool);
          return {
            address: poolAddress,
            id: poolId,
            type: PoolType.Stable,
            fee: FeeUtils.fromPermill(pool.fee.toNumber()),
            tokens: poolTokens,
            ...poolDelta,
            ...poolPegs,
            ...this.getPoolLimits(),
          } as PoolBase;
        } catch (e) {
          console.warn(`Skipping pool ${id.toString()}\n`, String(e));
          return null;
        }
      }
    );
    const results = await Promise.all(stablePools);
    return results.filter((pool): pool is PoolBase => pool !== null);
  }

  async getPoolFees(
    _block: number,
    _poolPair: PoolPair,
    poolAddress: string
  ): Promise<PoolFees> {
    const pool = this.pools.find(
      (pool) => pool.address === poolAddress
    ) as StableSwapBase;
    return {
      fee: pool.pegsFee as PoolFee,
    } as StableSwapFees;
  }

  private async getPoolPegs(
    poolId: string,
    poolInfo: PalletStableswapPoolInfo,
    blockNumber: string
  ): Promise<Partial<StableSwapBase>> {
    const poolPegs = await this.api.query.stableswap.poolPegs(poolId);
    if (poolPegs.isNone) {
      return this.getDefaultPegs(poolInfo);
    }

    const pegs = poolPegs.unwrap();

    const latestPegs = await this.getLatestPegs(poolInfo, pegs, blockNumber);
    const recentPegs = this.getRecentPegs(pegs);
    const fee = FeeUtils.fromPermill(poolInfo.fee.toNumber());
    const maxPegUpdate = FeeUtils.fromPerbill(pegs.maxPegUpdate.toNumber());

    const currentPegsUpdatedAt = pegs.updatedAt.toString();

    const [updatedFee, updatedPegs] = StableMath.recalculatePegs(
      JSON.stringify(recentPegs),
      currentPegsUpdatedAt,
      JSON.stringify(latestPegs),
      blockNumber,
      FeeUtils.toRaw(maxPegUpdate).toString(),
      FeeUtils.toRaw(fee).toString()
    );

    const updatedFeePermill = Number(updatedFee) * PERMILL_DENOMINATOR;
    return {
      pegsFee: FeeUtils.fromPermill(updatedFeePermill),
      pegs: updatedPegs,
    };
  }

  private getDefaultPegs(poolInfo: PalletStableswapPoolInfo) {
    const defaultFee = poolInfo.fee;
    const defaultPegs = StableMath.defaultPegs(poolInfo.assets.length);
    return {
      pegsFee: FeeUtils.fromPermill(defaultFee.toNumber()),
      pegs: defaultPegs,
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
      } else if (s.isMmOracle) {
        const h160 = s.asMmOracle;
        const { price, decimals, updatedAt } = await this.mmOracle.getData(
          h160.toString()
        );

        const priceDenom = 10 ** decimals;
        return [
          [price.toString(), priceDenom.toString()],
          updatedAt.toString(),
        ];
      } else if (s.isValue) {
        return [s.asValue.map((p) => p.toString()), blockNumber];
      } else {
        throw Error(s.type + ' is not supported');
      }
    });
    return Promise.all(latest);
  }

  protected async subscribeUpdates(): UnsubscribePromise {
    return this.api.query.system.number(async (parachainBlock) => {
      const blockNumber = parachainBlock.toString();
      this.pools.forEach(async (p) => {
        const poolData = this.poolsData.get(p.address);
        if (poolData) {
          const [poolDelta, poolPegs] = await Promise.all([
            this.getPoolDelta(p.id!, poolData, blockNumber),
            this.getPoolPegs(p.id!, poolData, blockNumber),
          ]);

          const tokens = p.tokens.map((t) => {
            if (t.id === p.id) {
              return {
                ...t,
                balance: poolDelta.totalIssuance,
              };
            }
            return t;
          });
          Object.assign(p, { tokens: tokens }, poolDelta, poolPegs);
        }
      });
    });
  }
}
