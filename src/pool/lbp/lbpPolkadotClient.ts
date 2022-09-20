import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import { PolkadotClient } from '../../client';
import { PoolBase, PoolFee, PoolType } from '../../types';
import { bnum, scale } from '../../utils/bignumber';
import { WeightedPoolToken } from './lbpPool';
import math from './lbpMath';

interface LbpPoolData {
  readonly assets: string[];
  readonly feeCollector: string;
  readonly fee: number[];
  readonly repayTarget: number;
  readonly initialWeight: number;
  readonly finalWeight: number;
  readonly start: number;
  readonly end: number;
}

export class LbpPolkadotClient extends PolkadotClient {
  private readonly MAX_FINAL_WEIGHT = scale(bnum(100), 6);

  async getPools(): Promise<PoolBase[]> {
    const poolAssets = await this.api.query.lbp.poolData.entries();
    const pools = poolAssets.map(async (asset: [StorageKey<AnyTuple>, Codec]) => {
      const poolAddress = this.getStorageKey(asset, 0);
      const poolEntry = asset[1].toJSON() as unknown as LbpPoolData;
      const poolTokens = await this.getPoolTokens(poolAddress, poolEntry.assets);
      const linearWeight = await this.getLinearWeight(poolEntry);
      const assetAWeight = bnum(linearWeight);
      const assetBWeight = this.MAX_FINAL_WEIGHT.minus(bnum(assetAWeight));
      return {
        address: poolAddress,
        type: PoolType.LBP,
        tradeFee: poolEntry.fee as PoolFee,
        tokens: [
          { ...poolTokens[0], weight: assetAWeight } as WeightedPoolToken,
          { ...poolTokens[1], weight: assetBWeight } as WeightedPoolToken,
        ],
      } as PoolBase;
    });
    return Promise.all(pools);
  }

  async getLinearWeight(poolEntry: LbpPoolData): Promise<string> {
    const currentBlock = await this.api.query.system.number();
    return math.calculateLinearWeights(
      poolEntry.start.toString(),
      poolEntry.end.toString(),
      poolEntry.initialWeight.toString(),
      poolEntry.finalWeight.toString(),
      currentBlock.toString()
    );
  }
}
