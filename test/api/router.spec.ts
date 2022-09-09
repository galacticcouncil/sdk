import { Router } from '../../src/api';
import { PoolService, PoolType } from '../../src/types';
import { MockXykPoolService } from '../lib/mockXykPoolService';

describe('Router with mocked XYK pool service', () => {
  let poolService: PoolService;
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
          poolId: 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3',
          poolType: PoolType.XYK,
          tokenIn: '1',
          tokenOut: '2',
          feePercentage: '0.3',
        },
      ],
      [
        {
          poolId: 'bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ',
          poolType: PoolType.XYK,
          tokenIn: '1',
          tokenOut: '0',
          feePercentage: '0.3',
        },
        {
          poolId: 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq',
          poolType: PoolType.XYK,
          tokenIn: '0',
          tokenOut: '2',
          feePercentage: '0.3',
        },
      ],
    ]);
  });

  it('Should return all assets in pool', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const result = await router.getAllAssets();
    expect(result).toStrictEqual([
      { token: '0', symbol: 'BSX' },
      { token: '2', symbol: 'AUSD' },
      { token: '1', symbol: 'KSM' },
    ]);
  });

  it('Should return all assets pair reacheable from token 1 (KSM)', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const result = await router.getAssetPairs('1');
    expect(result).toStrictEqual([
      { token: '2', symbol: 'AUSD' },
      { token: '0', symbol: 'BSX' },
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
