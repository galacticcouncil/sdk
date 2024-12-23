import {
  BalanceConfigBuilder,
  SolanaQueryConfig,
} from '@galacticcouncil/xcm-core';

export function solana() {
  return {
    native,
  };
}

function native(): BalanceConfigBuilder {
  return {
    build: ({ address }) => {
      return new SolanaQueryConfig({
        address: address,
        func: 'rpc_getBalance',
        module: 'Native',
      });
    },
  };
}
