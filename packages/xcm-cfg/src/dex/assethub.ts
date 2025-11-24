import {
  AnyChain,
  Asset,
  AssetAmount,
  Dex,
  Parachain,
  SwapQuote,
} from '@galacticcouncil/xcm-core';

import { AssethubClient } from '../clients';
import { XcmEncoder } from '../utils/xcm-encoder';

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

    const client = this.chain.api;
    const api = client.getUnsafeApi();

    const encodedIn = XcmEncoder.encodeLocationForUnsafeApi(aIn);
    const encodedOut = XcmEncoder.encodeLocationForUnsafeApi(aOut);

    const result =
      await api.apis.AssetConversionApi.quote_price_tokens_for_exact_tokens(
        encodedIn,
        encodedOut,
        amountOut.amount,
        true
      );

    if (!result.success) {
      throw new Error('Failed to get swap quote');
    }

    return {
      amount: BigInt(result.value),
    } as SwapQuote;
  }
}
