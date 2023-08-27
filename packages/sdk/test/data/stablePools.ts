import { PoolType } from '../../src/types';

export const stablePools = [
  {
    address: 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq',
    type: PoolType.Stable,
    maxInRatio: 3000,
    maxOutRatio: 3000,
    minTradingLimit: 1000,
    tokens: [
      {
        id: '0',
        balance: '235000000000000000000',
        decimals: 12,
        symbol: 'DAI',
      },
      {
        id: '1',
        balance: '35000000000000000',
        decimals: 12,
        symbol: 'USDC',
      },
      {
        id: '2',
        balance: '35000000000000000',
        decimals: 12,
        symbol: 'USDT',
      },
      {
        id: '3',
        balance: '175000000000000',
        decimals: 12,
        symbol: 'FRAX',
      },
    ],
  },
  {
    address: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3',
    type: PoolType.Stable,
    maxInRatio: 3000,
    maxOutRatio: 3000,
    minTradingLimit: 1000,
    tokens: [
      {
        id: '2',
        balance: '4000000000000',
        decimals: 12,
        symbol: 'USDT',
      },
      {
        id: '1',
        balance: '175000000000000',
        decimals: 12,
        symbol: 'USDC',
      },
    ],
  },
];
