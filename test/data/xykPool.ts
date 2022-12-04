import { PoolFee, PoolType } from '../../src/types';

export const xykPool = {
  address: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3',
  type: PoolType.XYK,
  tradeFee: [3, 1000] as PoolFee,
  maxInRatio: 3000,
  maxOutRatio: 3000,
  minTradingLimit: 1000,
  tokens: [
    {
      id: '1',
      balance: '3684960401086',
      decimals: 12,
      symbol: 'KSM',
    },
    {
      id: '2',
      balance: '174291804564300',
      decimals: 12,
      symbol: 'AUSD',
    },
  ],
};
