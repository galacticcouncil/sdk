import { AssetType, pool } from '../../src';

const { PoolType } = pool;

const token: AssetType = 'Token';

export const xykPools = [
  {
    address: 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq',
    type: PoolType.XYK,
    maxInRatio: 3000n,
    maxOutRatio: 3000n,
    minTradingLimit: 1000n,
    tokens: [
      {
        id: 0,
        balance: 235000000000000000000n,
        decimals: 12,
        existentialDeposit: 1000n,
        type: token,
      },
      {
        id: 2,
        balance: 35000000000000000n,
        decimals: 12,
        existentialDeposit: 1000n,
        type: token,
      },
    ],
  },
  {
    address: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3',
    type: PoolType.XYK,
    maxInRatio: 3000n,
    maxOutRatio: 3000n,
    minTradingLimit: 1000n,
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
  },
  {
    address: 'bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ',
    type: PoolType.XYK,
    maxInRatio: 3000n,
    maxOutRatio: 3000n,
    minTradingLimit: 1000n,
    tokens: [
      {
        id: 0,
        balance: 265000000000000000000n,
        decimals: 12,
        existentialDeposit: 1000n,
        type: token,
      },
      {
        id: 1,
        balance: 845000000000000n,
        decimals: 12,
        existentialDeposit: 1000n,
        type: token,
      },
    ],
  },
  // HOLLAR pool — gives assets {0,1,2} a route to a reference asset so the
  // liquidity gate can resolve their depth. Balanced so existing-asset depth
  // sits above MIN_LIQUIDITY
  {
    address: 'bXjHOLLARP1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    type: PoolType.XYK,
    maxInRatio: 3000n,
    maxOutRatio: 3000n,
    minTradingLimit: 1000n,
    tokens: [
      {
        id: 2,
        balance: 1000000000000000n,
        decimals: 12,
        existentialDeposit: 1000n,
        type: token,
      },
      {
        id: 222,
        balance: 1000000000000000n,
        decimals: 12,
        existentialDeposit: 1000n,
        type: token,
      },
    ],
  },
  // Thin pool for asset 3 — routable to HOLLAR via asset 2 but with a max
  // balance tiny enough that asset-3 depth falls below MIN_LIQUIDITY.
  {
    address: 'bXjHOLLARP2aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    type: PoolType.XYK,
    maxInRatio: 3000n,
    maxOutRatio: 3000n,
    minTradingLimit: 1000n,
    tokens: [
      {
        id: 3,
        balance: 100n,
        decimals: 12,
        existentialDeposit: 1000n,
        type: token,
      },
      {
        id: 2,
        balance: 100n,
        decimals: 12,
        existentialDeposit: 1000n,
        type: token,
      },
    ],
  },
];
