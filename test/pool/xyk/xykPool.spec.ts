import { XykPool } from '../../../src/pool';
import { xykPool } from '../../data/xykPool';

describe('Xyk Pool', () => {
  let pool: XykPool;

  beforeEach(() => {
    pool = XykPool.fromPool(xykPool);
  });

  it('Should return valid PoolPair for assets 1 & 2', async () => {
    expect(pool).toBeDefined();
    const result = pool.parsePoolPair('1', '2');
    expect(result.tradeFee.toString()).toStrictEqual((parseFloat(xykPool.tradeFee) / 100).toString());
    expect(result.tokenIn).toStrictEqual(xykPool.tokens[0].id);
    expect(result.balanceIn.toString()).toStrictEqual(xykPool.tokens[0].balance);
    expect(result.tokenOut).toStrictEqual(xykPool.tokens[1].id);
    expect(result.balanceOut.toString()).toStrictEqual(xykPool.tokens[1].balance);
  });
});
