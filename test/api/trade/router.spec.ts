import { TradeRouter } from '../../../src/api';
import { PoolService, PoolType } from '../../../src/types';
import { bnum, scale } from '../../../src/utils/bignumber';
import { MockXykPoolService } from '../../lib/mockXykPoolService';

describe('Router with mocked XYK pool service', () => {
  let poolService: PoolService;
  let router: TradeRouter;

  beforeEach(() => {
    poolService = new MockXykPoolService();
    router = new TradeRouter(poolService);
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
          fee: '0.3',
        },
      ],
      [
        {
          poolId: 'bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ',
          poolType: PoolType.XYK,
          tokenIn: '1',
          tokenOut: '0',
          fee: '0.3',
        },
        {
          poolId: 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq',
          poolType: PoolType.XYK,
          tokenIn: '0',
          tokenOut: '2',
          fee: '0.3',
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

  it('Should return best sell price swaps between token 1 (KSM) & 2 (aUSD)', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const result = await router.getBestSellPrice(
      '1',
      '2',
      scale(bnum('1'), 12)
    );
    expect(result[0].swapAmount.toString()).toStrictEqual('1000000000000');
    expect(result[0].swapFee.toString()).toStrictEqual('928913904931550');
    expect(result[0].returnAmount.toString()).toStrictEqual(
      '309637968310516955'
    );
    expect(result[0].returnFinalAmount.toString()).toStrictEqual(
      '308709054405585405'
    );
    expect(result[0].returnFinalAmount.toString()).toStrictEqual(
      result[1].swapAmount.toString()
    );
    expect(result[1].swapAmount.toString()).toStrictEqual('308709054405585405');
    expect(result[1].swapFee.toString()).toStrictEqual('136716056121');
    expect(result[1].returnAmount.toString()).toStrictEqual('45572018707330');
    expect(result[1].returnFinalAmount.toString()).toStrictEqual(
      '45435302651209'
    );
  });

  it('Should return best buy price swaps between token 0 (BSX) & 2 (aUSD)', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const result = await router.getBestBuyPrice('0', '2', scale(bnum('1'), 12));
    expect(result[0].swapAmount.toString()).toStrictEqual('21328275112');
    expect(result[0].swapFee.toString()).toStrictEqual('19836153161128');
    expect(result[0].returnAmount.toString()).toStrictEqual('6612051053709534');
    expect(result[0].returnFinalAmount.toString()).toStrictEqual(
      '6631887206870662'
    );
    expect(result[0].swapAmount.toString()).toStrictEqual(
      result[1].returnFinalAmount.toString()
    );
    expect(result[1].swapAmount.toString()).toStrictEqual('1000000000000');
    expect(result[1].swapFee.toString()).toStrictEqual('63793445');
    expect(result[1].returnAmount.toString()).toStrictEqual('21264481667');
    expect(result[1].returnFinalAmount.toString()).toStrictEqual('21328275112');
  });
});
