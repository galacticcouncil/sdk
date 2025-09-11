import { AccountId, CompatibilityLevel, FixedSizeArray } from 'polkadot-api';
import { HydrationQueries } from '@galacticcouncil/descriptors';
import { toHex } from '@polkadot-api/utils';
import { blake2b } from '@noble/hashes/blake2b';

import { type Observable, map, of, switchMap } from 'rxjs';

import { PoolType, PoolFee, PoolLimits, PoolFees, PoolToken } from '../types';
import { PoolClient } from '../PoolClient';

import {
  HYDRATION_SS58_PREFIX,
  PERMILL_DENOMINATOR,
  TRADEABLE_DEFAULT,
} from '../../consts';
import { fmt } from '../../utils';

import { StableMath } from './StableMath';
import { StableSwapBase, StableSwapFees } from './StableSwap';

const AMOUNT_MAX = 340282366920938463463374607431768211455n;

type TStableswapPool = HydrationQueries['Stableswap']['Pools']['Value'];
type TStableswapPoolPegs = HydrationQueries['Stableswap']['PoolPegs']['Value'];

export class StableSwapClient extends PoolClient<StableSwapBase> {
  private poolsData: Map<string, TStableswapPool> = new Map([]);

  protected async loadPools(): Promise<StableSwapBase[]> {
    const [entries, parachainBlock, limits] = await Promise.all([
      this.api.query.Stableswap.Pools.getEntries(),
      this.api.query.System.Number.getValue(),
      this.getPoolLimits(),
    ]);

    const pools = entries.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const poolAddress = this.getPoolAddress(id);
      const [poolDelta, poolTokens, poolPegs] = await Promise.all([
        this.getPoolDelta(id, value, parachainBlock),
        this.getPoolTokens(id, value),
        this.getPoolPegs(id, value, parachainBlock),
      ]);

      this.poolsData.set(poolAddress, value);
      return {
        address: poolAddress,
        id: id,
        type: PoolType.Stable,
        fee: fmt.fromPermill(value.fee),
        tokens: poolTokens,
        ...poolDelta,
        ...poolPegs,
        ...limits,
      } as StableSwapBase;
    });
    return Promise.all(pools);
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

    const totalIssuance =
      await this.api.query.Tokens.TotalIssuance.getValue(poolId);
    return {
      amplification: BigInt(amplification),
      totalIssuance: totalIssuance,
    } as Partial<StableSwapBase>;
  }

  private async getPoolTokens(
    poolId: number,
    poolInfo: TStableswapPool
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

    const tokens = await Promise.all(poolTokens);
    const share = await this.api.query.AssetRegistry.Assets.getValue(poolId);
    tokens.push({
      id: poolId,
      decimals: share?.decimals,
      existentialDeposit: share?.existential_deposit,
      balance: AMOUNT_MAX,
      tradeable: TRADEABLE_DEFAULT,
      type: share?.asset_type.type,
    } as PoolToken);

    return tokens;
  }

  private async getPoolPegs(
    poolId: number,
    poolInfo: TStableswapPool,
    blockNumber: number
  ): Promise<Pick<StableSwapBase, 'pegs' | 'pegsFee'>> {
    const pegs = await this.api.query.Stableswap.PoolPegs.getValue(poolId);

    if (!pegs) {
      return this.getDefaultPegs(poolInfo);
    }

    const latestPegs = await this.getLatestPegs(poolInfo, pegs, blockNumber);
    const recentPegs = this.getRecentPegs(pegs);
    const maxPegUpdate = fmt.fromPermill(pegs.max_peg_update);
    const fee = fmt.fromPermill(poolInfo.fee);

    const [updatedFee, updatedPegs] = StableMath.recalculatePegs(
      JSON.stringify(recentPegs),
      JSON.stringify(latestPegs),
      blockNumber.toString(),
      fmt.toDecimals(maxPegUpdate).toString(),
      fmt.toDecimals(fee).toString()
    );

    const updatedFeePermill = Number(updatedFee) * PERMILL_DENOMINATOR;

    return {
      pegsFee: fmt.fromPermill(updatedFeePermill),
      pegs: updatedPegs,
    };
  }

  private getDefaultPegs(poolInfo: TStableswapPool) {
    const defaultFee = poolInfo.fee;
    const defaultPegs = StableMath.defaultPegs(poolInfo.assets.length);
    return {
      pegsFee: fmt.fromPermill(defaultFee),
      pegs: defaultPegs,
    };
  }

  private getRecentPegs(poolPegs: TStableswapPoolPegs) {
    const { current } = poolPegs;
    return Array.from(current.entries()).map(([_, pegs]) =>
      pegs.map((p) => p.toString())
    );
  }

  private async getLatestPegs(
    poolInfo: TStableswapPool,
    poolPegs: TStableswapPoolPegs,
    blockNumber: number
  ) {
    const { source } = poolPegs;

    const assets = Array.from(poolInfo.assets.entries()).map(([_, id]) => id);

    const latest = source.map(async (s, i) => {
      //TODO: Add MMOracle
      if (s.type === 'Oracle') {
        const [oracleName, oraclePeriod, oracleAsset] = s.value;
        const oracleKey = [oracleAsset, assets[i]].sort(
          (a, b) => a - b
        ) as FixedSizeArray<2, number>;

        const oracleEntry = await this.api.query.EmaOracle.Oracles.getValue(
          oracleName,
          oracleKey,
          oraclePeriod
        );

        if (!oracleEntry) {
          return undefined;
        }
        const [{ price, updated_at }] = oracleEntry;

        const priceNum = price.n.toString();
        const priceDenom = price.d.toString();

        return oracleAsset.toString() === oracleKey[0].toString()
          ? [[priceNum, priceDenom], updated_at.toString()]
          : [[priceDenom, priceNum], updated_at.toString()];
      } else {
        return [s.value.map((p) => p.toString()), blockNumber];
      }
    });
    return Promise.all(latest);
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

  async getPoolFees(pool: StableSwapBase): Promise<PoolFees> {
    return {
      fee: pool.fee as PoolFee,
    } as StableSwapFees;
  }

  getPoolType(): PoolType {
    return PoolType.Stable;
  }

  async isSupported(): Promise<boolean> {
    const query = this.api.query.Stableswap.Pools;
    const compatibilityToken = await this.api.compatibilityToken;
    return query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      compatibilityToken
    );
  }

  subscribePoolChange(pool: StableSwapBase): Observable<StableSwapBase> {
    const query = this.api.query.System.Number;
    const poolData = this.poolsData.get(pool.address);

    if (!poolData || !pool.id) {
      return of(pool);
    }

    return query.watchValue('best').pipe(
      switchMap((parachainBlock) => {
        return this.getPoolDelta(pool.id, poolData, parachainBlock);
      }),
      map((delta) => Object.assign({}, pool, delta))
    );
  }
}
