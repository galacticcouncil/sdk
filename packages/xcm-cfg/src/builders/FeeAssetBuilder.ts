import {
  Asset,
  FeeAssetConfigBuilder,
  SubstrateCallConfig,
} from '@galacticcouncil/xcm-core';

import { hdx } from '../assets';

function accountCurrencyMap(): FeeAssetConfigBuilder {
  return {
    build: ({ address, chain }) =>
      new SubstrateCallConfig({
        chain,
        call: async (): Promise<Asset> => {
          const api = await chain.api;
          const asset =
            await api.query.multiTransactionPayment.accountCurrencyMap(address);
          const assetd = asset.isSome ? asset.toString() : '0';
          const feeAsset = chain.findAssetById(assetd);
          return feeAsset ? feeAsset.asset : hdx;
        },
      }),
  };
}

const multiTransactionPayment = () => {
  return {
    accountCurrencyMap,
  };
};

export function FeeAssetBuilder() {
  return {
    multiTransactionPayment,
  };
}
