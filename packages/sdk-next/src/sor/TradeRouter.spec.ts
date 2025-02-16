import { TradeRouter } from './TradeRouter';

import { IPoolCtxProvider, PoolBase, PoolFee, PoolFees, xyk } from '../pool';
import { xykPools } from '../../test/data';

const fees: xyk.XykPoolFees = {
  exchangeFee: [3, 1000] as PoolFee,
};

class MockCtxProvider implements IPoolCtxProvider {
  getPools(): Promise<PoolBase[]> {
    return Promise.resolve(xykPools);
  }

  getPoolFees(): Promise<PoolFees> {
    return Promise.resolve(fees);
  }
}

describe('TradeRouter with mocked pool ctx', () => {
  let ctx: IPoolCtxProvider;
  let sor: TradeRouter;

  beforeEach(() => {
    ctx = new MockCtxProvider();
    sor = new TradeRouter(ctx);
  });

  it('Should return best spot price between token 1 & 2', async () => {
    const bestSpotPrice = await sor.getBestSpotPrice(1, 2);
    expect(bestSpotPrice?.amount).toStrictEqual(46707792958579n);
    expect(bestSpotPrice?.decimals).toStrictEqual(12);
  });

  it('Should throw error if token pair identical', async () => {
    try {
      await sor.getBestSpotPrice(1, 1);
    } catch (error) {
      expect(error).toHaveProperty(
        'message',
        "Trading pair can't be identical"
      );
    }
  });

  it('Should return best sell trade between token 1 & 2', async () => {
    const sell = await sor.getBestSell(1, 2, 1_000_000_000_000n);
    const firstRoute = sell.swaps[0];
    const lastRoute = sell.swaps[sell.swaps.length - 1];
    expect(sell.amountIn).toStrictEqual(firstRoute.amountIn);
    expect(sell.amountOut).toStrictEqual(lastRoute.amountOut);
  });

  it('Should return best buy trade between token 0 & 2', async () => {
    const buy = await sor.getBestBuy(0, 2, 1_000_000_000_000n);
    const firstRoute = buy.swaps[buy.swaps.length - 1];
    const lastRoute = buy.swaps[0];
    expect(buy.amountOut).toStrictEqual(firstRoute.amountOut);
    expect(buy.amountIn).toStrictEqual(lastRoute.amountIn);
  });
});
