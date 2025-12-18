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

export const xykPoolWud = {
  type: PoolType.XYK,
  address: '12xht4Z98XuyAPRxVc5T2AE84DUooLhFCSuWEAixuDKLeVKA',
  tokens: [
    {
      id: 1000085,
      decimals: 10,
      existentialDeposit: 200000000000000n,
      balance: 150504729523701123n,
      type: token,
    },
    {
      id: 0,
      decimals: 12,
      existentialDeposit: 1000000000000n,
      balance: 1430651368273430n,
      type: token,
    },
  ],
  maxInRatio: 3n,
  maxOutRatio: 3n,
  minTradingLimit: 1000n,
};

export const xykPoolWud2 = {
  type: PoolType.XYK,
  address: '15BuQdFibo2wZmwksPWCJ3owmXCduSU56gaXzVKDc1pcCcsd',
  tokens: [
    {
      id: 1000085,
      decimals: 10,
      existentialDeposit: 200000000000000n,
      balance: 804747144640348861228n,
      type: token,
    },
    {
      id: 5,
      decimals: 10,
      existentialDeposit: 17540000n,
      balance: 183891995299946n,
      type: token,
    },
  ],
  maxInRatio: 3n,
  maxOutRatio: 3n,
  minTradingLimit: 1000n,
};
