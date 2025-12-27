import {
  AnyChain,
  Asset,
  AssetAmount,
  Dex,
  Parachain,
  SwapQuote,
} from '@galacticcouncil/xcm-core';

import { TypeRegistry } from '@polkadot/types';

import { AssethubClient } from '../clients';

const registry = new TypeRegistry();

const getAssetLocation = (location: any) => {
  return registry.createType('MultiLocation', location);
};

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

    const aInLocation = getAssetLocation(aIn);
    const aOutLocation = getAssetLocation(aOut);

    const api = await this.chain.api;
    const balance =
      await api.call.assetConversionApi.quotePriceTokensForExactTokens(
        aInLocation.toU8a(),
        aOutLocation.toU8a(),
        amountOut.amount,
        true
      );

    const amountIn = balance.unwrap();
    return {
      amount: amountIn.toBigInt(),
    } as SwapQuote;
  }
}
