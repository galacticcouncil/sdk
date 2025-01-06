import {
  AnyChain,
  Asset,
  AssetAmount,
  Parachain,
  Swap,
  SwapQuote,
} from '@galacticcouncil/xcm-core';
import {
  buildRoute,
  PoolService,
  PoolType,
  TradeRouter,
} from '@galacticcouncil/sdk';

import { memoize1 } from '@thi.ng/memoize';

export class HydrationSwap implements Swap {
  readonly chain: Parachain;
  readonly poolService?: PoolService;

  readonly getRouter = memoize1(async (mem: number) => {
    console.log('init swap router', mem, '✅');
    const api = await this.chain.api;
    const pool = this.poolService ? this.poolService : new PoolService(api);
    return new TradeRouter(pool, {
      includeOnly: [PoolType.Omni, PoolType.Stable],
    });
  });

  constructor(chain: AnyChain, poolService?: PoolService) {
    this.chain = chain as Parachain;
    this.poolService = poolService;
  }

  async getQuote(
    assetIn: Asset,
    assetOut: Asset,
    amountOut: AssetAmount
  ): Promise<SwapQuote> {
    const aIn = this.chain.getMetadataAssetId(assetIn);
    const aOut = this.chain.getMetadataAssetId(assetOut);
    const amount = amountOut.toDecimal(amountOut.decimals);

    const router = await this.getRouter(1);
    const trade = await router.getBestBuy(
      aIn.toString(),
      aOut.toString(),
      amount
    );

    const amountIn = BigInt(trade.amountIn.toNumber());
    return {
      amount: amountIn,
      route: buildRoute(trade.swaps),
    } as SwapQuote;
  }
}
