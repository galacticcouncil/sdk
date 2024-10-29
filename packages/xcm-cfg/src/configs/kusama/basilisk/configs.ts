import { BalanceConfigBuilder, FeeConfig } from '@galacticcouncil/xcm-core';

import { BalanceBuilder, FeeAssetBuilder } from '../../../builders';

const NATIVE_ASSET_ID = '0';

export const balance = (): BalanceConfigBuilder => {
  return {
    build: ({ address, asset }) => {
      if (asset.toString() === NATIVE_ASSET_ID) {
        return BalanceBuilder()
          .substrate()
          .system()
          .account()
          .build({ address, asset });
      }
      return BalanceBuilder()
        .substrate()
        .tokens()
        .accounts()
        .build({ address, asset });
    },
  };
};

export const fee = (): FeeConfig => {
  return {
    asset: FeeAssetBuilder().multiTransactionPayment().accountCurrencyMap(),
    balance: balance(),
  };
};
