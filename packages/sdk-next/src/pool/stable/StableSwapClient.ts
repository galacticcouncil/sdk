import {
  AccountId,
  CompatibilityLevel,
  FixedSizeArray,
  PolkadotClient,
} from 'polkadot-api';
import { HydrationQueries } from '@galacticcouncil/descriptors';
import { toHex } from '@polkadot-api/utils';
import { blake2b } from '@noble/hashes/blake2b';

import { Subscription } from 'rxjs';

import {
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
  PoolPair,
} from '../types';
import { PoolClient } from '../PoolClient';

import {
  HYDRATION_SS58_PREFIX,
  PERMILL_DENOMINATOR,
  RUNTIME_DECIMALS,
  TRADEABLE_DEFAULT,
} from '../../consts';
import { EvmClient } from '../../evm';
import { MmOracleClient } from '../../oracle';
import { fmt } from '../../utils';

import { StableMath } from './StableMath';
import { StableSwapBase, StableSwapFees } from './StableSwap';

type TStableswapPool = HydrationQueries['Stableswap']['Pools']['Value'];
type TStableswapPoolPegs = HydrationQueries['Stableswap']['PoolPegs']['Value'];

const { FeeUtils } = fmt;

export class StableSwapClient extends PoolClient<StableSwapBase> {
  protected mmOracle: MmOracleClient;

  private poolsData: Map<string, TStableswapPool> = new Map([]);

  constructor(client: PolkadotClient, evm: EvmClient) {
    super(client, evm);
    this.mmOracle = new MmOracleClient(evm);
  }

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

      // add virtual share (routing)
      poolTokens.push({
        id: id,
        tradeable: TRADEABLE_DEFAULT,
        balance: poolDelta.totalIssuance,
        decimals: RUNTIME_DECIMALS,
      } as PoolToken);

      this.poolsData.set(poolAddress, value);
      return {
        address: poolAddress,
        id: id,
        type: PoolType.Stable,
        fee: FeeUtils.fromPermill(value.fee),
        tokens: poolTokens,
        ...poolDelta,
        ...poolPegs,
        ...limits,
      } as StableSwapBase;
    });
    return Promise.all(pools);
  }

  async getPoolFees(pair: PoolPair, address: string): Promise<PoolFees> {
    return {
      fee: pool.fee as PoolFee,
    } as StableSwapFees;
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
    const maxPegUpdate = FeeUtils.fromPermill(pegs.max_peg_update);
    const fee = FeeUtils.fromPermill(poolInfo.fee);

    const [updatedFee, updatedPegs] = StableMath.recalculatePegs(
      JSON.stringify(recentPegs),
      JSON.stringify(latestPegs),
      blockNumber.toString(),
      FeeUtils.toRaw(maxPegUpdate).toString(),
      FeeUtils.toRaw(fee).toString()
    );

    const updatedFeePermill = Number(updatedFee) * PERMILL_DENOMINATOR;

    return {
      pegsFee: FeeUtils.fromPermill(updatedFeePermill),
      pegs: updatedPegs,
    };
  }

  private getDefaultPegs(poolInfo: TStableswapPool) {
    const defaultFee = poolInfo.fee;
    const defaultPegs = StableMath.defaultPegs(poolInfo.assets.length);
    return {
      pegsFee: FeeUtils.fromPermill(defaultFee),
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
      } else if (s.type === 'MMOracle') {
        const h160 = s.value.asHex();

        const { price, decimals, updatedAt } =
          await this.mmOracle.getData(h160);

        const priceDenom = 10 ** decimals;
        return [
          [price.toString(), priceDenom.toString()],
          updatedAt.toString(),
        ];
      } else {
        return [s.value.map((p) => p.toString()), blockNumber.toString()];
      }
    });
    return Promise.all(latest);
  }

  protected subscribeUpdates(): Subscription {
    return this.api.query.System.Number.watchValue('best').subscribe(
      (parachainBlock) => {
        this.store.update((pools) => {
          const updated = pools.map(async (pool) => {
            const poolData = this.poolsData.get(pool.address)!;
            const [poolDelta, poolPegs] = await Promise.all([
              this.getPoolDelta(pool.id, poolData, parachainBlock),
              this.getPoolPegs(pool.id, poolData, parachainBlock),
            ]);
            const tokens = pool.tokens.map((t) => {
              if (t.id === pool.id) {
                return {
                  ...t,
                  balance: poolDelta.totalIssuance,
                };
              }
              return t;
            });
            return {
              ...pool,
              tokens,
              ...poolDelta,
              ...poolPegs,
            } as StableSwapBase;
          });
          return Promise.all(updated);
        });
      }
    );
  }
}
