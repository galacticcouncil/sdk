import { TradeRouter } from '../../src/api';
import { PoolService, SellSwap, BuySwap } from '../../src/types';
import { MockXykPoolService } from '../lib/mockXykPoolService';

describe('TradeRouter with mocked XYK pool service', () => {
  let poolService: PoolService;
  let router: TradeRouter;

  beforeEach(() => {
    poolService = new MockXykPoolService();
    router = new TradeRouter(poolService);
  });

  it('Should return best sell price swaps between token 1 (KSM) & 2 (aUSD)', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const sell = await router.getBestSell('1', '2', 1);
    const sellHuman = sell.toHuman();
    const firstRoute = sellHuman.swaps[0];
    const lastRoute = sellHuman.swaps[sell.swaps.length - 1];
    expect(sellHuman.amountIn).toEqual(firstRoute.amountIn);
    expect(sellHuman.finalAmount).toEqual(lastRoute.finalAmount);

    sellHuman.swaps.reduce((a: SellSwap, b: SellSwap) => {
      expect(a.finalAmount).toEqual(b.amountIn);
    });
  });

  it('Should return best buy price swaps between token 0 (BSX) & 2 (aUSD)', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const buy = await router.getBestBuy('0', '2', 1);
    const buyHuman = buy.toHuman();
    const firstRoute = buyHuman.swaps[0];
    const lastRoute = buyHuman.swaps[buy.swaps.length - 1];
    expect(buyHuman.amountOut).toEqual(firstRoute.amountOut);
    expect(buyHuman.finalAmount).toEqual(lastRoute.finalAmount);

    buyHuman.swaps.reduce((a: BuySwap, b: BuySwap) => {
      expect(a.finalAmount).toEqual(b.amountOut);
    });
  });
});
