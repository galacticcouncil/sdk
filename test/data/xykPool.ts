import { XykPoolFees } from '../../src/pool/xyk/XykPool';
import { PoolFee, PoolType } from '../../src/types';

const fees: XykPoolFees = {
  exchangeFee: [3, 1000] as PoolFee,
};

export const xykPool = {
  address: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3',
  type: PoolType.XYK,
  fees: fees,
  maxInRatio: 3000,
  maxOutRatio: 3000,
  minTradingLimit: 1000,
  tokens: [
    {
      id: '1',
      balance: '4000000000000',
      decimals: 12,
      symbol: 'KSM',
    },
    {
      id: '2',
      balance: '175000000000000',
      decimals: 12,
      symbol: 'AUSD',
    },
  ],
};
