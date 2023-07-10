import { XykPoolFees } from '../../src/pool/xyk/XykPool';
import { PoolFee, PoolType } from '../../src/types';

const fees: XykPoolFees = {
  exchangeFee: [3, 1000] as PoolFee,
};

export const xykPools = [
  {
    address: 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq',
    type: PoolType.XYK,
    fees: fees,
    maxInRatio: 3000,
    maxOutRatio: 3000,
    minTradingLimit: 1000,
    tokens: [
      {
        id: '0',
        balance: '100000000000000',
        decimals: 12,
        symbol: 'BSX',
      },
      {
        id: '2',
        balance: '100000000000',
        decimals: 12,
        symbol: 'AUSD',
      },
    ],
  },
  {
    address: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3',
    type: PoolType.XYK,
    fees: fees,
    maxInRatio: 3000,
    maxOutRatio: 3000,
    minTradingLimit: 1000,
    tokens: [
      {
        id: '1',
        balance: '10000000000000000',
        decimals: 12,
        symbol: 'KSM',
      },
      {
        id: '2',
        balance: '470000000000000000',
        decimals: 12,
        symbol: 'AUSD',
      },
    ],
  },
  {
    address: 'bXmKSSACEp9rm8NuUAyDHiW2AjcLzZ4pvuRczz2ZJNkWVqFFm',
    type: PoolType.XYK,
    fees: fees,
    maxInRatio: 3000,
    maxOutRatio: 3000,
    minTradingLimit: 1000,
    tokens: [
      {
        id: '2',
        balance: '100000000000000',
        decimals: 12,
        symbol: 'AUSD',
      },
      {
        id: '3',
        balance: '10000000000000',
        decimals: 18,
        symbol: 'PHA',
      },
    ],
  },
  {
    address: 'bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ',
    type: PoolType.XYK,
    fees: fees,
    maxInRatio: 3000,
    maxOutRatio: 3000,
    minTradingLimit: 1000,
    tokens: [
      {
        id: '0',
        balance: '10000000000000000000',
        decimals: 12,
        symbol: 'BSX',
      },
      {
        id: '1',
        balance: '30000000000000',
        decimals: 12,
        symbol: 'KSM',
      },
    ],
  },
];
