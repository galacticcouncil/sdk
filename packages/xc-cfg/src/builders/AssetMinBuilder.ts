import {
  MinConfigBuilder,
  SubstrateQueryConfig,
} from '@galacticcouncil/xc-core';

export function AssetMinBuilder() {
  return {
    assetRegistry,
    assets,
  };
}

function assetRegistry() {
  const pallet = 'assetRegistry';
  return {
    assetMetadatas: (): MinConfigBuilder => ({
      build: ({ asset }) =>
        new SubstrateQueryConfig({
          module: pallet,
          func: 'assetMetadatas',
          args: [asset],
          transform: async (response) => {
            return BigInt(response?.minimalBalance?.toString() ?? '0');
          },
        }),
    }),
    currencyMetadatas: (): MinConfigBuilder => ({
      build: ({ asset }) =>
        new SubstrateQueryConfig({
          module: pallet,
          func: 'currencyMetadatas',
          args: [asset],
          transform: async (response) => {
            return BigInt(response?.minimalBalance?.toString() ?? '0');
          },
        }),
    }),
  };
}

function assets() {
  return {
    asset: (): MinConfigBuilder => ({
      build: ({ asset }) =>
        new SubstrateQueryConfig({
          module: 'assets',
          func: 'asset',
          args: [asset],
          transform: async (response) => {
            return BigInt(response?.minBalance?.toString() ?? '0');
          },
        }),
    }),
  };
}
