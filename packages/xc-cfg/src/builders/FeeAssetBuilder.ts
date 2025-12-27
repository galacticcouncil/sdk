import { FeeAssetConfigBuilder } from '@galacticcouncil/xc-core';

import { hdx } from '../assets';
import { HydrationClient } from '../clients';

const NATIVE_ASSET_ID = '0';

function accountCurrencyMap(): FeeAssetConfigBuilder {
  return {
    build: async ({ address, chain }) => {
      const client = new HydrationClient(chain);

      const asset = await client
        .api()
        .query.MultiTransactionPayment.AccountCurrencyMap.getValue(address);
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
