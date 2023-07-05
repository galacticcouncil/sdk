import { PoolFee, PoolType } from '../../src/types';

export const xykPools = [
  {
    address: 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq',
    type: PoolType.XYK,
    exchangeFee: [3, 1000] as PoolFee,
    maxInRatio: 3000,
    maxOutRatio: 3000,
    minTradingLimit: 1000,
    tokens: [
      {
        id: '0',
        balance: '235000000000000000000',
        decimals: 12,
        symbol: 'BSX',
      },
      {
        id: '2',
        balance: '35000000000000000',
        decimals: 12,
        symbol: 'AUSD',
      },
    ],
  },
  {
    address: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3',
    type: PoolType.XYK,
    exchangeFee: [3, 1000] as PoolFee,
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
  },
  {
    address: 'bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ',
    type: PoolType.XYK,
    exchangeFee: [3, 1000] as PoolFee,
    maxInRatio: 3000,
    maxOutRatio: 3000,
    minTradingLimit: 1000,
    tokens: [
      {
        id: '0',
        balance: '265000000000000000000',
        decimals: 12,
        symbol: 'BSX',
      },
      {
        id: '1',
        balance: '845000000000000',
        decimals: 12,
        symbol: 'KSM',
      },
    ],
  },
];
