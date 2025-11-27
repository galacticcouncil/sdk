import {
  BalanceConfigBuilder,
  SolanaQueryConfig,
} from '@galacticcouncil/xcm-core';

export function solana() {
  return {
    native,
    token,
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

function token(): BalanceConfigBuilder {
  return {
    build: ({ address, asset, chain }) => {
      const assetId = chain.getBalanceAssetId(asset);
      if (!assetId) {
        throw new Error(`Invalid token address: ${asset}`);
      }

      return new SolanaQueryConfig({
        address: address,
        token: assetId.toString(),
        func: 'getBalance',
        module: 'Token',
      });
    },
  };
}
