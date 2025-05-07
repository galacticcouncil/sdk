import {
  AnyChain,
  Asset,
  AssetAmount,
  Dex,
  Parachain,
  SwapQuote,
} from '@galacticcouncil/xcm-core';
import {
  PoolService,
  PoolType,
  RUNTIME_DECIMALS,
  TradeRouter,
  TradeUtils,
} from '@galacticcouncil/sdk';

import { memoize1 } from '@thi.ng/memoize';

import { HydrationClient } from '../clients';

export class HydrationDex implements Dex {
  readonly chain: Parachain;
  readonly client: HydrationClient;
  readonly poolService?: PoolService;

  readonly getCtx = memoize1(async (mem: number) => {
    console.log('init swap router', mem, '✅');
    const api = await this.chain.api;
    const pool = this.poolService ? this.poolService : new PoolService(api);
    const txUtils = new TradeUtils(api);
    const router = new TradeRouter(pool, {
      includeOnly: [PoolType.Omni, PoolType.Stable, PoolType.XYK],
    });
    return {
      router,
      txUtils,
    };
  });

  constructor(chain: AnyChain, poolService?: PoolService) {
    this.chain = chain as Parachain;
    this.client = new HydrationClient(this.chain);
    this.poolService = poolService;
  }

  async getQuote(
    assetIn: Asset,
    assetOut: Asset,
    amountOut: AssetAmount,
    fallbackPrice?: boolean
  ): Promise<SwapQuote> {
    const aIn = this.chain.getMetadataAssetId(assetIn);
    const aOut = this.chain.getMetadataAssetId(assetOut);
    const amount = amountOut.toDecimal(amountOut.decimals);

    const { router, txUtils } = await this.getCtx(1);
    try {
      const mostLiquidRoute = await router.getMostLiquidRoute(
        aIn.toString(),
        aOut.toString()
      );

      const trade = await router.getBuy(
        aIn.toString(),
        aOut.toString(),
        amount,
        mostLiquidRoute
      );

      const amountIn = BigInt(trade.amountIn.toNumber());
      return {
        amount: amountIn,
        route: txUtils.buildRoute(trade.swaps),
      } as SwapQuote;
    } catch (e) {
      if (fallbackPrice) {
        const fallbackPrice = await this.getFallbackPrice(
          assetIn,
          amountOut.amount
        );
        return {
          amount: fallbackPrice,
        } as SwapQuote;
      }
      throw e;
    }
  }

  private async getFallbackPrice(
    asset: Asset,
    amount: bigint
  ): Promise<bigint> {
    const api = await this.chain.api;
    const id = this.chain.getAssetId(asset);
    const systemToAssetPrice =
      await api.query.multiTransactionPayment.acceptedCurrencies(id);
    const fallbackPrice = BigInt(systemToAssetPrice.toString()) * amount;
    const base = Math.pow(10, RUNTIME_DECIMALS);
    return fallbackPrice / BigInt(base);
  }
}
