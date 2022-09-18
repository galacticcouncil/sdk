import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import { PolkadotClient } from '../../client';
import { PoolBase, PoolType } from '../../types';
import { bnum } from '../../utils/bignumber';

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

  getTradeFee(): string {
    const exFee = this.api.consts.xyk.getExchangeFee;
    const [numerator, denominator] = exFee.toJSON() as number[];
    const res = bnum(numerator).div(bnum(denominator));
    return res.multipliedBy(100).toString();
  }
}
