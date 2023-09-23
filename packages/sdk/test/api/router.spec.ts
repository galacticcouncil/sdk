import { Router } from '../../src/api';
import { IPoolService, PoolType } from '../../src/types';
import { MockXykPoolService } from '../lib/mockXykPoolService';

describe('Router with mocked XYK pool service', () => {
  let poolService: IPoolService;
  let router: Router;

  beforeEach(() => {
    poolService = new MockXykPoolService();
    router = new Router(poolService);
  });

  it('Should return suggested hops from token 1 (KSM) to 2 (aUSD)', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const result = await router.getAllPaths('1', '2');
    expect(result).toStrictEqual([
      [
        {
          poolAddress: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3',
          poolId: undefined,
          pool: PoolType.XYK,
          assetIn: '1',
          assetOut: '2',
        },
      ],
      [
        {
          poolAddress: 'bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ',
          poolId: undefined,
          pool: PoolType.XYK,
          assetIn: '1',
          assetOut: '0',
        },
        {
          poolAddress: 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq',
          poolId: undefined,
          pool: PoolType.XYK,
          assetIn: '0',
          assetOut: '2',
        },
      ],
    ]);
  });

  it('Should return all assets in pool', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const result = await router.getAllAssets();
    expect(result).toStrictEqual([
      { icon: 'BSX', id: '0', symbol: 'BSX', meta: undefined },
      { icon: 'AUSD', id: '2', symbol: 'AUSD', meta: undefined },
      { icon: 'KSM', id: '1', symbol: 'KSM', meta: undefined },
    ]);
  });

  it('Should return all assets pair reacheable from token 1 (KSM)', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const result = await router.getAssetPairs('1');
    expect(result).toStrictEqual([
      { icon: 'AUSD', id: '2', symbol: 'AUSD', meta: undefined },
      { icon: 'BSX', id: '0', symbol: 'BSX', meta: undefined },
    ]);
  });

  it('Should throw error if not-existing asset used in given pool', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    await expect(async () => {
      await router.getAssetPairs('not-existing');
    }).rejects.toThrow('not-existing is not supported token');
  });
});
