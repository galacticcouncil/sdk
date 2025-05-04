import { XykPool } from './XykPool';

import { xykPool } from '../../../test/data';

describe('Xyk Pool', () => {
  let pool: XykPool;

  beforeEach(() => {
    pool = XykPool.fromPool(xykPool);
  });

  it('Should return valid PoolPair for assets 1 & 2', async () => {
    expect(pool).toBeDefined();
    const result = pool.parsePair('1', '2');
    expect(result.assetIn).toStrictEqual(xykPool.tokens[0].id);
    expect(result.balanceIn.toString()).toStrictEqual(
      xykPool.tokens[0].balance
    );
    expect(result.assetOut).toStrictEqual(xykPool.tokens[1].id);
    expect(result.balanceOut.toString()).toStrictEqual(
      xykPool.tokens[1].balance
    );
  });
});
