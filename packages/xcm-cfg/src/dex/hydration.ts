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
  TradeRouteBuilder,
  TradeRouter,
  TxBuilderFactory,
} from '@galacticcouncil/sdk';
import { RUNTIME_DECIMALS } from '@galacticcouncil/common';

import { memoize1 } from '@thi.ng/memoize';

import { HydrationClient } from '../clients';

export class HydrationDex implements Dex {
  readonly chain: Parachain;
  readonly client: HydrationClient;
  readonly poolCtx: PoolService;
  readonly txBuilder: TxBuilderFactory;

  readonly getCtx = memoize1(async (mem: number) => {
    console.log('init swap router', mem, '✅');
    return new TradeRouter(this.poolCtx, {
      includeOnly: [
        PoolType.Aave,
        PoolType.Omni,
        PoolType.Stable,
        PoolType.XYK,
      ],
    });
  });

  constructor(chain: AnyChain, poolCtx: PoolService) {
    this.chain = chain as Parachain;
    this.poolCtx = poolCtx;
    this.client = new HydrationClient(this.chain);
    this.txBuilder = new TxBuilderFactory(poolCtx.api, poolCtx.evm);
  }

  async getCalldata(
    account: string,
    assetIn: Asset,
    assetOut: Asset,
    amountOut: AssetAmount,
    slippage = 0
  ): Promise<string> {
    const aIn = this.chain.getMetadataAssetId(assetIn);
    const aOut = this.chain.getMetadataAssetId(assetOut);
    const amount = amountOut.toDecimal(amountOut.decimals);

    const router = await this.getCtx(1);

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

    const extrinsic = await this.txBuilder
      .trade(trade)
      .withBeneficiary(account)
      .withSlippage(slippage)
      .build();

    return extrinsic.hex;
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

    const router = await this.getCtx(1);
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
    const api = await this.chain.api;
    const id = this.chain.getAssetId(asset);
    const systemToAssetPrice =
      await api.query.multiTransactionPayment.acceptedCurrencies(id);
    const fallbackPrice = BigInt(systemToAssetPrice.toString()) * amount;
    const base = Math.pow(10, RUNTIME_DECIMALS);
    return fallbackPrice / BigInt(base);
  }
}
