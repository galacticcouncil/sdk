import { TradeRouter } from './TradeRouter';
import { SellSwap, BuySwap } from './types';

import {
  IPoolService,
  PoolBase,
  PoolFee,
  PoolFees,
  XykPoolFees,
} from '../pool';
import { xykPools } from '../../test/data';

const fees: XykPoolFees = {
  exchangeFee: [3, 1000] as PoolFee,
};

class MockXykPoolService implements IPoolService {
  getPools(): Promise<PoolBase[]> {
    return Promise.resolve(xykPools);
  }

  getPoolFees(): Promise<PoolFees> {
    return Promise.resolve(fees);
  }
}

describe('TradeRouter with mocked XYK pool service', () => {
  let poolService: IPoolService;
  let router: TradeRouter;

  beforeEach(() => {
    poolService = new MockXykPoolService();
    router = new TradeRouter(poolService);
  });

  it('Should return best spot price between token 1 (KSM) & 2 (aUSD)', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const bestSpotPrice = await router.getBestSpotPrice('1', '2');
    expect(bestSpotPrice?.amount.toString()).toEqual(
      '46707793025305.313609467466196651139368'
    );
    expect(bestSpotPrice?.decimals).toEqual(12);
  });

  it('Should return undefined is same token pair token 1 (KSM) & 1 (KSM)', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const bestSpotPrice = await router.getBestSpotPrice('1', '1');
    expect(bestSpotPrice === undefined);
  });

  it('Should return best sell trade between token 1 (KSM) & 2 (aUSD)', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const sell = await router.getBestSell('1', '2', 1);
    const sellHuman = sell.toHuman();
    const firstRoute = sellHuman.swaps[0];
    const lastRoute = sellHuman.swaps[sell.swaps.length - 1];
    expect(sellHuman.amountIn).toEqual(firstRoute.amountIn);
    expect(sellHuman.amountOut).toEqual(lastRoute.amountOut);

    sellHuman.swaps.reduce((a: SellSwap, b: SellSwap) => {
      expect(a.amountOut).toEqual(b.amountIn);
    });
  });

  it('Should return best buy trade between token 0 (BSX) & 2 (aUSD)', async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const buy = await router.getBestBuy('0', '2', 1);
    const buyHuman = buy.toHuman();
    const firstRoute = buyHuman.swaps[buy.swaps.length - 1];
    const lastRoute = buyHuman.swaps[0];
    expect(buyHuman.amountOut).toEqual(firstRoute.amountOut);
    expect(buyHuman.amountIn).toEqual(lastRoute.amountIn);

    buyHuman.swaps.reduce((a: BuySwap, b: BuySwap) => {
      expect(a.amountOut).toEqual(b.amountIn);
    });
  });
});
