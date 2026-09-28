import { FeeAssetConfigBuilder } from '@galacticcouncil/xc-core';

import { hdx } from '../assets';
import { HydrationClient } from '../clients';

function accountCurrencyMap(): FeeAssetConfigBuilder {
  return {
    build: async ({ address, chain }) => {
      const client = new HydrationClient(chain);

      const assetId = await client.getFeeAsset(address);
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
