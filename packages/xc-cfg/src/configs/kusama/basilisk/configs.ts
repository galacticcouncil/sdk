import { FeeConfig } from '@galacticcouncil/xc-core';

import { FeeAssetBuilder } from '../../../builders';

export const fee = (): FeeConfig => {
  return {
    asset: FeeAssetBuilder().multiTransactionPayment().accountCurrencyMap(),
  };
};
