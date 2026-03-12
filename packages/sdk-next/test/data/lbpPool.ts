import { AssetType, pool } from '../../src';

const { PoolType } = pool;

const token: AssetType = 'Token';

export const lbpPool = {
  address: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM4',
  type: PoolType.LBP,
  maxInRatio: 3000n,
  maxOutRatio: 3000n,
  minTradingLimit: 10_000_000n,
  repayFeeApply: false,
  fee: [200, 1000000] as [number, number],
  tokens: [
    {
      id: 0,
      balance: 1200000000000000000n,
      weight: 3500n,
      decimals: 12,
      existentialDeposit: 1000n,
      type: token,
    },
    {
      id: 123456,
      balance: 8000000000000000000n,
      weight: 8500n,
      decimals: 12,
      existentialDeposit: 1000n,
      type: token,
    },
  ],
};
