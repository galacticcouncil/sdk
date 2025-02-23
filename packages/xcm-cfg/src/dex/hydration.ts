import {
  AnyChain,
  Asset,
  AssetAmount,
  Dex,
  Parachain,
  SwapQuote,
} from '@galacticcouncil/xcm-core';
import {
  buildRoute,
  PoolService,
  PoolType,
  TradeRouter,
} from '@galacticcouncil/sdk';

import { memoize1 } from '@thi.ng/memoize';

import { HydrationClient } from '../clients';

export class HydrationDex implements Dex {
  readonly chain: Parachain;
  readonly client: HydrationClient;
  readonly poolService?: PoolService;

  readonly getRouter = memoize1(async (mem: number) => {
    console.log('init swap router', mem, '✅');
    const api = await this.chain.api;
    const pool = this.poolService ? this.poolService : new PoolService(api);
    return new TradeRouter(pool, {
      includeOnly: [PoolType.Omni, PoolType.Stable, PoolType.XYK],
    });
  });

  constructor(chain: AnyChain, poolService?: PoolService) {
    this.chain = chain as Parachain;
    this.client = new HydrationClient(this.chain);
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
