import { AccountId, CompatibilityLevel } from 'polkadot-api';
import { HydrationQueries } from '@galacticcouncil/descriptors';
import { toHex } from '@polkadot-api/utils';
import { blake2b } from '@noble/hashes/blake2b';

import { type Observable, map, of, switchMap } from 'rxjs';

import { PoolType, PoolFee, PoolLimits, PoolFees, PoolToken } from '../types';
import { PoolClient } from '../PoolClient';

import { HYDRATION_SS58_PREFIX, TRADEABLE_DEFAULT } from '../../consts';
import { fmt } from '../../utils';

import { StableMath } from './StableMath';
import { StableSwapBase, StableSwapFees } from './StableSwap';

const AMOUNT_MAX = 340282366920938463463374607431768211455n;

type TStableswapPool = HydrationQueries['Stableswap']['Pools']['Value'];

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
      const [poolDelta, poolTokens] = await Promise.all([
        this.getPoolDelta(id, value, parachainBlock),
        this.getPoolTokens(id, value),
      ]);

      this.poolsData.set(poolAddress, value);
      return {
        address: poolAddress,
        id: id,
        type: PoolType.Stable,
        fee: fmt.fromPermill(value.fee),
        tokens: poolTokens,
        ...poolDelta,
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
        tradeable: tradeability,
        balance: balance,
      } as PoolToken;
    });

    const tokens = await Promise.all(poolTokens);
    const share = await this.api.query.AssetRegistry.Assets.getValue(poolId);
    tokens.push({
      id: poolId,
      decimals: share?.decimals,
      existentialDeposit: share?.existential_deposit,
      tradeable: TRADEABLE_DEFAULT,
      balance: AMOUNT_MAX,
    } as PoolToken);

    return tokens;
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
        console.log('sync stables ' + parachainBlock);
        return this.getPoolDelta(pool.id, poolData, parachainBlock);
      }),
      map((delta) => Object.assign({}, pool, delta))
    );
  }
}
