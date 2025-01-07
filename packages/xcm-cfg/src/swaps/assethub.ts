import {
  AnyChain,
  Asset,
  AssetAmount,
  Parachain,
  Swap,
  SwapQuote,
} from '@galacticcouncil/xcm-core';

import { TypeRegistry } from '@polkadot/types';
import { StagingXcmV3MultiLocation } from '@polkadot/types/lookup';

const registry = new TypeRegistry();

const getAssetLocation = (location: any) => {
  return registry.createType('MultiLocation', location);
};

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
}
