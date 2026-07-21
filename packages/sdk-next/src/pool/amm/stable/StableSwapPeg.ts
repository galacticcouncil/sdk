import { PERMILL_DENOMINATOR } from '../../../consts';
import { fmt } from '../../../utils';

import { PoolPegs } from '../../types';

import { StableMath } from './StableMath';
import { TPeg, TPegLatest, TStableswap, TStableswapPeg } from './types';

const { FeeUtils } = fmt;

export class StableSwapPeg {
  static compute(
    pool: TStableswap,
    poolPegs: TStableswapPeg,
    latest: TPegLatest[],
    blockNumber: number
  ): TPeg {
    const recentPegs = StableSwapPeg.getRecent(poolPegs);
    const fee = FeeUtils.fromPermill(pool.fee);
    const maxPegUpdate = FeeUtils.fromPerbill(poolPegs.max_peg_update);

    const latestPegs = latest.map(({ pair, updatedAt }) => [pair, updatedAt]);
    const targetPeg = latest.find((p) => p.source);

    const currentPegsUpdatedAt = poolPegs.updated_at
      ? poolPegs.updated_at.toString()
      : targetPeg?.updatedAt;

    if (!currentPegsUpdatedAt) {
      throw new Error('Current peg unknown!');
    }

    const [updatedFee, updatedPegs] = StableMath.recalculatePegs(
      JSON.stringify(recentPegs),
      currentPegsUpdatedAt,
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

  static getDefault(pool: TStableswap): TPeg {
    return {
      pegsFee: FeeUtils.fromPermill(pool.fee),
      pegs: StableMath.defaultPegs(pool.assets.length),
    };
  }

  static getRecent(poolPegs: TStableswapPeg): PoolPegs {
    const { current } = poolPegs;
    return Array.from(current.entries()).map(([_, prices]) =>
      prices.map((p) => p.toString())
    );
  }
}
