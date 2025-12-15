import {
  BalanceConfigBuilder,
  Parachain,
  SubstrateQueryConfig,
} from '@galacticcouncil/xc-core';
import { encodeAssetId, encodeLocation } from '@galacticcouncil/common';

export function substrate() {
  return {
    assets,
    system,
    tokens,
    ormlTokens,
    foreignAssets,
  };
}

function assets() {
  return {
    account: (): BalanceConfigBuilder => ({
      build: ({ address, asset, chain }) => {
        const assetId = chain.getBalanceAssetId(asset);
        const encodedAssetId = encodeAssetId(assetId);

        return new SubstrateQueryConfig({
          module: 'Assets',
          func: 'Account',
          args: [encodedAssetId, address],
          transform: async (response) => {
            return BigInt(response?.balance?.toString() ?? '0');
          },
        });
      },
    }),
  };
}

function foreignAssets() {
  return {
    account: (): BalanceConfigBuilder => ({
      build: ({ address, asset, chain }) => {
        const ctx = chain as Parachain;

        const assetLocation = ctx.getAssetXcmLocation(asset);
        if (!assetLocation) {
          throw new Error('Missing asset xcm location for ' + asset.key);
        }

        const encodedLocation = encodeLocation(assetLocation);

        return new SubstrateQueryConfig({
          module: 'ForeignAssets',
          func: 'Account',
          args: [encodedLocation, address],
          transform: async (response) => {
            return BigInt(response?.balance?.toString() ?? '0');
          },
        });
      },
    }),
  };
}

function system() {
  return {
    account: (): BalanceConfigBuilder => ({
      build: ({ address }) =>
        new SubstrateQueryConfig({
          module: 'System',
          func: 'Account',
          args: [address],
          transform: async (response) => {
            const data = response?.data;
            const free = BigInt(data?.free?.toString() ?? '0');
            const frozen = BigInt(
              (data?.miscFrozen ?? data?.frozen)?.toString() ?? '0'
            );
            return free >= frozen ? free - frozen : 0n;
          },
        }),
    }),
  };
}

function tokens() {
  return {
    accounts: (): BalanceConfigBuilder => ({
      build: ({ address, asset, chain }) => {
        const assetId = chain.getBalanceAssetId(asset);
        const encodedAssetId = encodeAssetId(assetId);
        return new SubstrateQueryConfig({
          module: 'Tokens',
          func: 'Accounts',
          args: [address, encodedAssetId],
          transform: async (response) => {
            const free = BigInt(response?.free?.toString() ?? '0');
            const frozen = BigInt(response?.frozen?.toString() ?? '0');
            return free >= frozen ? free - frozen : 0n;
          },
        });
      },
    }),
  };
}

function ormlTokens() {
  return {
    accounts: (): BalanceConfigBuilder => ({
      build: ({ address, asset, chain }) => {
        const assetId = chain.getBalanceAssetId(asset);
        const encodedAssetId = encodeAssetId(assetId);
        return new SubstrateQueryConfig({
          module: 'OrmlTokens',
          func: 'Accounts',
          args: [address, encodedAssetId],
          transform: async (response) => {
            const free = BigInt(response?.free?.toString() ?? '0');
            const frozen = BigInt(response?.frozen?.toString() ?? '0');
            return free >= frozen ? free - frozen : 0n;
          },
        });
      },
    }),
  };
}
