import {
  BalanceConfigBuilder,
  SuiQueryConfig,
} from '@galacticcouncil/xcm-core';

export function sui() {
  return {
    native,
  };
}

function native(): BalanceConfigBuilder {
  return {
    build: ({ address }) => {
      return new SuiQueryConfig({
        address: address,
        func: 'sui_getBalance',
        module: 'Native',
      });
    },
  };
}
