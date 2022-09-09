import { TradeRouter } from '../../src/api';
import { PoolService, Swap } from '../../src/types';
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
    const trade = await router.getBestSell('1', '2', 1);
    const tradeHuman = trade.toHuman();
    const firstRoute = tradeHuman.swaps[0];
    const lastRoute = tradeHuman.swaps[trade.swaps.length - 1];
    expect(tradeHuman.tradeAmount).toEqual(firstRoute.swapAmount);
    expect(tradeHuman.returnAmount).toEqual(lastRoute.returnFinalAmount);

    tradeHuman.swaps.reduce((a: Swap, b: Swap) => {
      expect(a.returnFinalAmount).toEqual(b.swapAmount);
    });
  });

  it('Should return best buy price swaps between token 0 (BSX) & 2 (aUSD)', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const trade = await router.getBestBuy('0', '2', 1);
    const tradeHuman = trade.toHuman();
    const firstRoute = tradeHuman.swaps[0];
    const lastRoute = tradeHuman.swaps[trade.swaps.length - 1];
    expect(tradeHuman.tradeAmount).toEqual(lastRoute.swapAmount);
    expect(tradeHuman.returnAmount).toEqual(firstRoute.returnFinalAmount);
    tradeHuman.swaps.reduce((a: Swap, b: Swap) => {
      expect(a.swapAmount).toEqual(b.returnFinalAmount);
    });
  });
});
