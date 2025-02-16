import { Router } from './Router';

import { IPoolCtxProvider, PoolBase, PoolFees, PoolType } from '../pool';
import { xykPools } from '../../test/data';

class MockCtxProvider implements IPoolCtxProvider {
  getPools(): Promise<PoolBase[]> {
    return Promise.resolve(xykPools);
  }

  getPoolFees(): Promise<PoolFees> {
    throw new Error('Method not implemented.');
  }
}

describe('Router with mocked XYK pool service', () => {
  let ctx: IPoolCtxProvider;
  let sor: Router;

  beforeEach(() => {
    ctx = new MockCtxProvider();
    sor = new Router(ctx);
  });

  it('Should return suggested hops from token 1 (KSM) to 2 (aUSD)', async () => {
    const result = await sor.getRoutes(1, 2);
    expect(result).toStrictEqual([
      [
        {
          poolAddress: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3',
          poolId: undefined,
          pool: PoolType.XYK,
          assetIn: 1,
          assetOut: 2,
        },
      ],
      [
        {
          poolAddress: 'bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ',
          poolId: undefined,
          pool: PoolType.XYK,
          assetIn: 1,
          assetOut: 0,
        },
        {
          poolAddress: 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq',
          poolId: undefined,
          pool: PoolType.XYK,
          assetIn: 0,
          assetOut: 2,
        },
      ],
    ]);
  });

  it('Should return all assets in pool', async () => {
    const result = await sor.getTradeableAssets();
    expect(result).toStrictEqual([0, 1, 2]);
  });
});
