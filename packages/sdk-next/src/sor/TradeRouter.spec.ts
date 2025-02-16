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

describe('TradeRouter with mocked XYK pool service', () => {
  let ctx: IPoolCtxProvider;
  let sor: TradeRouter;

  beforeEach(() => {
    ctx = new MockCtxProvider();
    sor = new TradeRouter(ctx);
  });

  it('Should return best spot price between token 1 (KSM) & 2 (aUSD)', async () => {
    const bestSpotPrice = await sor.getBestSpotPrice(1, 2);
    expect(bestSpotPrice?.amount).toEqual(46707793025305n);
    expect(bestSpotPrice?.decimals).toEqual(12);
  });

  it('Should return undefined is same token pair token 1 (KSM) & 1 (KSM)', async () => {
    const bestSpotPrice = await sor.getBestSpotPrice(1, 1);
    expect(bestSpotPrice === undefined);
  });

  it('Should return best sell trade between token 1 (KSM) & 2 (aUSD)', async () => {
    const sell = await sor.getBestSell(1, 2, 1_000_000_000_000n);
    const firstRoute = sell.swaps[0];
    const lastRoute = sell.swaps[sell.swaps.length - 1];
    expect(sell.amountIn).toEqual(firstRoute.amountIn);
    expect(sell.amountOut).toEqual(lastRoute.amountOut);
  });

  it('Should return best buy trade between token 0 (BSX) & 2 (aUSD)', async () => {
    const buy = await sor.getBestBuy(0, 2, 1_000_000_000_000n);
    const firstRoute = buy.swaps[buy.swaps.length - 1];
    const lastRoute = buy.swaps[0];
    expect(buy.amountOut).toEqual(firstRoute.amountOut);
    expect(buy.amountIn).toEqual(lastRoute.amountIn);
  });
});
