import { FeeAssetConfigBuilder } from '@galacticcouncil/xcm-core';

import { hdx } from '../assets';

const NATIVE_ASSET_ID = '0';

function accountCurrencyMap(): FeeAssetConfigBuilder {
  return {
    build: async ({ address, chain }) => {
      const api = await chain.api;
      const asset =
        await api.query.multiTransactionPayment.accountCurrencyMap(address);
      const assetd = asset.isSome ? asset.toString() : NATIVE_ASSET_ID;
      const feeAsset = chain.findAssetById(assetd);
      return feeAsset ? feeAsset.asset : hdx;
    },
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
