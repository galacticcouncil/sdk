import type { StorageKey } from '@polkadot/types';
import type { PalletStableswapPoolInfo } from '@polkadot/types/lookup';
import type { AnyTuple } from '@polkadot/types/types';
import type { Option } from '@polkadot/types-codec';
import { blake2AsHex, encodeAddress } from '@polkadot/util-crypto';
import { HYDRADX_SS58_PREFIX } from '../../consts';
import { PoolBase, PoolType, PoolFee, PoolLimits, PoolFees } from '../../types';
import { toPoolFee } from '../../utils/mapper';

import { PoolClient } from '../PoolClient';

import { StableMath } from './StableMath';
import { StableSwapBase, StableSwapFees } from './StableSwap';

export class StableSwapClient extends PoolClient {
  private poolsData: Map<string, PalletStableswapPoolInfo> = new Map([]);
  private pools: StableSwapBase[] = [];
  private _poolsLoaded = false;

  async getPools(): Promise<PoolBase[]> {
    const paraBlockNumber = await this.getParaChainBlock();
    if (this._poolsLoaded) {
      this.pools = await this.syncPools(paraBlockNumber);
    } else {
      this.pools = await this.loadPools(paraBlockNumber);
      this._poolsLoaded = true;
    }
    return this.pools;
  }

  private async loadPools(blockNumber: number): Promise<StableSwapBase[]> {
    const poolAssets = await this.api.query.stableswap.pools.entries();
    const pools = poolAssets.map(async (pool: [StorageKey<AnyTuple>, Option<PalletStableswapPoolInfo>]) => {
      const poolId = this.getStorageKey(pool, 0);
      const poolEntry = pool[1].unwrap();
      const poolAddress = this.getPoolAddress(poolId);
      const poolTokens = await this.getPoolTokens(
        poolAddress,
        poolEntry.assets.map((a) => a.toString())
      );

      poolTokens.push({
        id: poolId,
        symbol: '',
        icon: '',
        balance: '',
        decimals: 18,
      });

      const amplification = await this.getAmplification(poolEntry, blockNumber);
      const totalIssuance = await this.getTotalIssueance(poolId);
      this.poolsData.set(poolId, poolEntry);
      return {
        id: poolId,
        address: poolAddress,
        type: PoolType.Stable,
        amplification: amplification,
        fee: toPoolFee(poolEntry.fee.toNumber()),
        totalIssuance: totalIssuance,
        tokens: poolTokens,
        ...this.getPoolLimits(),
      } as StableSwapBase;
    });
    return Promise.all(pools);
  }

  private async syncPools(blockNumber: number): Promise<StableSwapBase[]> {
    const syncedPools = this.pools.map(async (pool: StableSwapBase) => {
      const poolEntry = this.poolsData.get(pool.id)!;
      const amplification = await this.getAmplification(poolEntry, blockNumber);
      const totalIssuance = await this.getTotalIssueance(pool.id);
      return {
        ...pool,
        amplification: amplification,
        totalIssuance: totalIssuance,
        tokens: await this.syncPoolTokens(pool.address, pool.tokens),
      } as StableSwapBase;
    });
    return Promise.all(syncedPools);
  }

  public async getParaChainBlock(): Promise<number> {
    const data = await this.api.query.system.number();
    return data.toNumber();
  }

  private async getTotalIssueance(poolId: string) {
    const issuance = await this.api.query.tokens.totalIssuance(poolId);
    return issuance.toString();
  }

  private async getAmplification(poolInfo: PalletStableswapPoolInfo, paraBlockNumber: number): Promise<string> {
    return StableMath.calculateAmplification(
      poolInfo.initialAmplification.toString(),
      poolInfo.finalAmplification.toString(),
      poolInfo.initialBlock.toString(),
      poolInfo.finalBlock.toString(),
      paraBlockNumber.toString()
    );
  }

  getPoolAddress(poolId: string) {
    const pool = Number(poolId);
    const name = StableMath.getPoolAddress(pool);
    return encodeAddress(blake2AsHex(name), HYDRADX_SS58_PREFIX);
  }

  async getPoolFees(_feeAsset: string, address: string): Promise<PoolFees> {
    const pool = this.pools.find((pool) => pool.address === address) as StableSwapBase;
    return {
      fee: pool.fee as PoolFee,
    } as StableSwapFees;
  }

  private getPoolLimits(): PoolLimits {
    const minTradingLimit = this.api.consts.stableswap.minTradingLimit.toJSON() as number;
    return { maxInRatio: 0, maxOutRatio: 0, minTradingLimit: minTradingLimit } as PoolLimits;
  }
}
