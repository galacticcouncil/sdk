import { FeeAssetConfigBuilder } from '@galacticcouncil/xcm-core';

import { getTypedApi } from '../utils/papi';
import { hdx } from '../assets';

const NATIVE_ASSET_ID = '0';

function accountCurrencyMap(): FeeAssetConfigBuilder {
  return {
    build: async ({ address, chain }) => {
      const client = chain.api;
      const api = getTypedApi(client);

      const asset = await api.query.MultiTransactionPayment.AccountCurrencyMap.getValue(address);
      const assetId = asset ? asset.toString() : NATIVE_ASSET_ID;
      const feeAsset = chain.findAssetById(assetId);
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
