import {
  AnyChain,
  Asset,
  AssetAmount,
  Dex,
  Parachain,
  SwapQuote,
} from '@galacticcouncil/xc-core';

import { AssethubClient } from '../clients';
import { encodeLocation } from '@galacticcouncil/common';

export class AssethubDex implements Dex {
  readonly chain: Parachain;
  readonly client: AssethubClient;

  constructor(chain: AnyChain) {
    this.chain = chain as Parachain;
    this.client = new AssethubClient(this.chain);
  }

  async getCalldata(
    _account: string,
    _assetIn: Asset,
    _assetOut: Asset,
    _amountOut: AssetAmount
  ): Promise<string> {
    throw Error('Not supported for ' + this.chain.key);
  }

  async getQuote(
    assetIn: Asset,
    assetOut: Asset,
    amountOut: AssetAmount
  ): Promise<SwapQuote> {
    const aIn = this.chain.getAssetXcmLocation(assetIn);
    const aOut = this.chain.getAssetXcmLocation(assetOut);

    const result = await this.client
      .api()
      .apis.AssetConversionApi.quote_price_tokens_for_exact_tokens(
        encodeLocation(aIn),
        encodeLocation(aOut),
        amountOut.amount,
        true
      );

    if (!result) {
      throw new Error('Failed to get swap quote');
    }

    return {
      amount: result,
    } as SwapQuote;
  }
}
