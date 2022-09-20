import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import { PolkadotClient } from '../../client';
import { PoolBase, PoolType, PoolFee } from '../../types';

export class XykPolkadotClient extends PolkadotClient {
  async getPools(): Promise<PoolBase[]> {
    const poolAssets = await this.api.query.xyk.poolAssets.entries();
    const pools = poolAssets.map(async (asset: [StorageKey<AnyTuple>, Codec]) => {
      const poolAddress = this.getStorageKey(asset, 0);
      const poolEntries = this.getStorageEntryArray(asset);
      const poolTokens = await this.getPoolTokens(poolAddress, poolEntries);
      return {
        address: poolAddress,
        type: PoolType.XYK,
        tradeFee: this.getTradeFee(),
        tokens: poolTokens,
      } as PoolBase;
    });
    return Promise.all(pools);
  }

  getTradeFee(): PoolFee {
    const exFee = this.api.consts.xyk.getExchangeFee;
    return exFee.toJSON() as PoolFee;
  }
}
