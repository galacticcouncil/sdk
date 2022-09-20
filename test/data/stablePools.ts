import { PoolType } from '../../src/types';

export const stablePools = [
  {
    address: 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq',
    type: PoolType.Stable,
    tradeFee: [3, 1000],
    tokens: [
      {
        id: '0',
        balance: '235315220453344458259',
        decimals: 12,
        symbol: 'DAI',
      },
      {
        id: '1',
        balance: '34783100690381537',
        decimals: 12,
        symbol: 'USDC',
      },
      {
        id: '2',
        balance: '34783100690381537',
        decimals: 12,
        symbol: 'USDT',
      },
      {
        id: '3',
        balance: '174291804564300',
        decimals: 12,
        symbol: 'FRAX',
      },
    ],
  },
  {
    address: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3',
    type: PoolType.Stable,
    tradeFee: [3, 1000],
    tokens: [
      {
        id: '2',
        balance: '3684960401086',
        decimals: 12,
        symbol: 'USDT',
      },
      {
        id: '1',
        balance: '174291804564300',
        decimals: 12,
        symbol: 'USDC',
      },
    ],
  },
];
