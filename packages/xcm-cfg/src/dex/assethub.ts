import {
  AnyChain,
  Asset,
  AssetAmount,
  Dex,
  Parachain,
  SwapQuote,
} from '@galacticcouncil/xcm-core';

import { TypeRegistry } from '@polkadot/types';
import { StagingXcmV3MultiLocation } from '@polkadot/types/lookup';

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
        aInLocation as unknown as StagingXcmV3MultiLocation,
        aOutLocation as unknown as StagingXcmV3MultiLocation,
        amountOut.amount,
        true
      );

    const amountIn = balance.unwrap();
    return {
      amount: amountIn.toBigInt(),
    } as SwapQuote;
  }

  getNativeAsset(): Asset {
    const native = this.chain.getAsset('dot');
    if (native) {
      return native;
    }
    throw new Error('Native asset configuration not found');
  }
}
