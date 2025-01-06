import {
  AnyChain,
  Asset,
  AssetAmount,
  Parachain,
  Swap,
  SwapQuote,
} from '@galacticcouncil/xcm-core';

import { TypeRegistry } from '@polkadot/types';

const registry = new TypeRegistry();

export class AssethubSwap implements Swap {
  readonly chain: Parachain;

  constructor(chain: AnyChain) {
    this.chain = chain as Parachain;
  }

  async getQuote(
    assetIn: Asset,
    assetOut: Asset,
    amountOut: AssetAmount
  ): Promise<SwapQuote> {
    const aIn = this.chain.getAssetXcmLocation(assetIn);
    const aOut = this.chain.getAssetXcmLocation(assetOut);
    const amount = amountOut.toDecimal(amountOut.decimals);

    const api = await this.chain.api;
    const balance =
      await api.call.assetConversionApi.quotePriceExactTokensForTokens(
        registry.createType('StagingXcmV3MultiLocation', aIn),
        registry.createType('StagingXcmV3MultiLocation', aOut),
        amount,
        true
      );

    const amountIn = balance.unwrap();
    return {
      amount: amountIn.toBigInt(),
    } as SwapQuote;
  }
}
