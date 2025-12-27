import {
  AnyChain,
  Asset,
  AssetAmount,
  Dex,
  Parachain,
  SwapQuote,
} from '@galacticcouncil/xc-core';
import { pool, sor, tx } from '@galacticcouncil/sdk-next';
import { RUNTIME_DECIMALS } from '@galacticcouncil/common';

import { memoize1 } from '@thi.ng/memoize';

import { HydrationClient } from '../clients';

const { PoolType } = pool;
const { TradeRouteBuilder, TradeRouter } = sor;
const { TxBuilderFactory } = tx;

type PoolContext = pool.PoolContextProvider;

export class HydrationDex implements Dex {
  readonly chain: Parachain;
  readonly client: HydrationClient;
  readonly poolCtx: PoolContext;
  readonly txBuilder: tx.TxBuilderFactory;

  readonly getCtx = memoize1(async (mem: number) => {
    console.log('init swap router', mem, '✅');
    const router = new TradeRouter(this.poolCtx);
    router.withFilter({
      useOnly: [PoolType.Aave, PoolType.Omni, PoolType.Stable, PoolType.XYK],
    });
    return router;
  });

  constructor(chain: AnyChain, poolCtx: PoolContext) {
    this.chain = chain as Parachain;
    this.poolCtx = poolCtx;
    this.client = new HydrationClient(this.chain);
    this.txBuilder = new TxBuilderFactory(poolCtx.client, poolCtx.evm);
  }

  async getCalldata(
    account: string,
    assetIn: Asset,
    assetOut: Asset,
    amountOut: AssetAmount,
    slippage = 0
  ): Promise<string> {
    const aIn = Number(this.chain.getMetadataAssetId(assetIn));
    const aOut = Number(this.chain.getMetadataAssetId(assetOut));
    const amount = amountOut.amount;

    const router = await this.getCtx(1);

    const mostLiquidRoute = await router.getMostLiquidRoute(aIn, aOut);

    const trade = await router.getBuy(aIn, aOut, amount, mostLiquidRoute);

    const txWrapper = await this.txBuilder
      .trade(trade)
      .withBeneficiary(account)
      .withSlippage(slippage)
      .build();

    const transaction = txWrapper.get();
    const encodedData = await transaction.getEncodedData();
    return encodedData.asHex();
  }

  async getQuote(
    assetIn: Asset,
    assetOut: Asset,
    amountOut: AssetAmount,
    fallbackPrice?: boolean
  ): Promise<SwapQuote> {
    const aIn = Number(this.chain.getMetadataAssetId(assetIn));
    const aOut = Number(this.chain.getMetadataAssetId(assetOut));
    const amount = amountOut.amount;

    const router = await this.getCtx(1);
    try {
      const mostLiquidRoute = await router.getMostLiquidRoute(aIn, aOut);

      const trade = await router.getBuy(aIn, aOut, amount, mostLiquidRoute);

      const amountIn = trade.amountIn;
      return {
        amount: amountIn,
        route: TradeRouteBuilder.build(trade.swaps),
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
    const id = this.chain.getAssetId(asset);

    const systemToAssetPrice = await this.client
      .api()
      .query.MultiTransactionPayment.AcceptedCurrencies.getValue(Number(asset));

    if (!systemToAssetPrice) {
      throw new Error(`No price found for asset ${asset}`);
    }

    const fallbackPrice = systemToAssetPrice * amount;
    const base = Math.pow(10, RUNTIME_DECIMALS);
    return fallbackPrice / BigInt(base);
  }
}
