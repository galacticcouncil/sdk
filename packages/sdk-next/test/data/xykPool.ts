import { AssetType, pool } from '../../src';

const { PoolType } = pool;

const token: AssetType = 'Token';

export const xykPool = {
  address: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3',
  type: PoolType.XYK,
  maxInRatio: 3000n,
  maxOutRatio: 3000n,
  minTradingLimit: 10_000_000n,
  tokens: [
    {
      id: 1,
      balance: 4000000000000n,
      decimals: 12,
      existentialDeposit: 1000n,
      type: token,
    },
    {
      id: 2,
      balance: 175000000000000n,
      decimals: 12,
      existentialDeposit: 1000n,
      type: token,
    },
  ],
};
