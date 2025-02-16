import { pool } from '../../src';

const { PoolType } = pool;

export const stablePools = [
  {
    address: 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq',
    type: PoolType.Stable,
    maxInRatio: 3000n,
    maxOutRatio: 3000n,
    minTradingLimit: 1000n,
    tokens: [
      {
        id: 0,
        balance: 235000000000000000000n,
        decimals: 12,
        existentialDeposit: 1000n,
        tradeable: 15,
      },
      {
        id: 1,
        balance: 35000000000000000n,
        decimals: 12,
        existentialDeposit: 1000n,
        tradeable: 15,
      },
      {
        id: 2,
        balance: 35000000000000000n,
        decimals: 12,
        existentialDeposit: 1000n,
        tradeable: 15,
      },
      {
        id: 3,
        balance: 175000000000000n,
        decimals: 12,
        existentialDeposit: 1000n,
        tradeable: 15,
      },
    ],
  },
  {
    address: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3',
    type: PoolType.Stable,
    maxInRatio: 3000n,
    maxOutRatio: 3000n,
    minTradingLimit: 1000n,
    tokens: [
      {
        id: 2,
        balance: 4000000000000n,
        decimals: 12,
        existentialDeposit: 1000n,
        tradeable: 15,
      },
      {
        id: 1,
        balance: 175000000000000n,
        decimals: 12,
        existentialDeposit: 1000n,
        tradeable: 15,
      },
    ],
  },
];
