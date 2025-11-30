import {
  BalanceConfigBuilder,
  Parachain,
  SubstrateQueryConfig,
} from '@galacticcouncil/xc-core';

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
        return new SubstrateQueryConfig({
          module: 'assets',
          func: 'account',
          args: [assetId, address],
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

        return new SubstrateQueryConfig({
          module: 'foreignAssets',
          func: 'account',
          args: [assetLocation, address],
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
          module: 'system',
          func: 'account',
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
        return new SubstrateQueryConfig({
          module: 'tokens',
          func: 'accounts',
          args: [address, assetId],
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
        return new SubstrateQueryConfig({
          module: 'ormlTokens',
          func: 'accounts',
          args: [address, assetId],
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
