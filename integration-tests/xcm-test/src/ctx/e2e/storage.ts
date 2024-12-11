import {
  Asset,
  big,
  Parachain,
  ParachainAssetData,
} from '@galacticcouncil/xcm-core';
import { ApiPromise } from '@polkadot/api';

import { getAccount } from './account';
import { findNestedKey } from '../../utils/json';

const BALANCE = 1000n;

export const initStorage = async (api: ApiPromise, chain: Parachain) => {
  const chainDecimals = api.registry.chainDecimals[0];
  const chainAssets = Array.from(chain.assetsData.values());

  let storage = {
    System: {
      Account: populateSystem(chain, chainDecimals),
    },
  };

  // Single asset (system only)
  if (chainAssets.length === 1) {
    return storage;
  }

  if (useTokensPallet(api)) {
    storage = Object.assign(
      {
        Tokens: {
          Accounts: populateTokens(chain, chainAssets, chainDecimals),
        },
      },
      storage
    );
  }

  if (useAssetsPallet(api)) {
    storage = Object.assign(
      {
        Assets: {
          Account: populateAssets(chain, chainAssets, chainDecimals),
        },
      },
      storage
    );
  }

  if (useForeignAssetsPallet(api)) {
    storage = Object.assign(
      {
        ForeignAssets: {
          Account: populateForeignAssets(chain, chainAssets, chainDecimals),
        },
      },
      storage
    );
  }

  if (useOrmlTokensPallet(api)) {
    storage = Object.assign(
      {
        OrmlTokens: {
          Accounts: populateOrmlTokens(chain, chainAssets, chainDecimals),
        },
      },
      storage
    );
  }

  if (useEvmAccountPallet(api)) {
    storage = Object.assign(
      {
        EVM: {
          AccountStorages: [],
        },
      },
      storage
    );
  }

  return storage;
};

const useAssetsPallet = (api: ApiPromise): boolean => {
  return !!api.query.assets?.account;
};

const useForeignAssetsPallet = (api: ApiPromise): boolean => {
  return !!api.query.foreignAssets?.account;
};

const useTokensPallet = (api: ApiPromise): boolean => {
  return !!api.query.tokens?.accounts;
};

const useEvmAccountPallet = (api: ApiPromise): boolean => {
  return !!api.query.evm?.accountStorages;
};

const useOrmlTokensPallet = (api: ApiPromise): boolean => {
  return !!api.query.ormlTokens?.accounts;
};

const useNormalizedBalance = (
  chain: Parachain,
  chainDecimals: number,
  chainAsset: Asset
): bigint => {
  const assetDecimals = chain.usesChainDecimals
    ? chainDecimals
    : chain.getAssetDecimals(chainAsset) || chainDecimals;
  const assetMin = chain.getAssetMin(chainAsset);
  const assetMinFmt = big.toBigInt(assetMin, assetDecimals);
  const assetBalance = BALANCE * 10n ** BigInt(assetDecimals);
  return assetMinFmt > assetBalance ? assetMinFmt + assetBalance : assetBalance;
};

const populateErc20 = (
  chain: Parachain,
  assets: ParachainAssetData[],
  decimals: number
) => {
  const acc = getAccount(chain);
  return assets
    .filter((a) => a.asset.key.toString().endsWith('_mwh'))
    .map((a) => {
      const assetId = chain.getBalanceAssetId(a.asset);
      const balance = useNormalizedBalance(chain, decimals, a.asset);
      return [
        [assetId, acc.address],
        `0x${balance.toString(16).toUpperCase()}`,
      ];
    });
};

const populateAssets = (
  chain: Parachain,
  assets: ParachainAssetData[],
  decimals: number
) => {
  const acc = getAccount(chain);
  return assets
    .filter((a) => !!a.id)
    .filter((a) => !a.id?.toString().startsWith('0x'))
    .map((a) => {
      const assetId = chain.getBalanceAssetId(a.asset);
      const balance = useNormalizedBalance(chain, decimals, a.asset);
      return [[assetId, acc.address], { balance: balance }];
    });
};

const populateForeignAssets = (
  chain: Parachain,
  assets: ParachainAssetData[],
  decimals: number
) => {
  const acc = getAccount(chain);
  return assets
    .filter((a) => !!a.xcmLocation)
    .filter((a) => findNestedKey(a.xcmLocation, 'Parachain'))
    .map((a) => {
      const assetLocation = chain.getAssetXcmLocation(a.asset);
      const balance = useNormalizedBalance(chain, decimals, a.asset);
      return [[assetLocation, acc.address], { balance: balance }];
    });
};

const populateOrmlTokens = (
  chain: Parachain,
  assets: ParachainAssetData[],
  decimals: number
) => {
  const acc = getAccount(chain);
  return assets
    .filter((a) => !!a.xcmLocation)
    .map((a) => {
      const assetId = chain.getBalanceAssetId(a.asset);
      const balance = useNormalizedBalance(chain, decimals, a.asset);
      return [[acc.address, assetId], { free: balance }];
    });
};

const populateTokens = (
  chain: Parachain,
  assets: ParachainAssetData[],
  decimals: number
) => {
  const acc = getAccount(chain);
  return assets.map((a) => {
    const assetId = chain.getBalanceAssetId(a.asset);
    const balance = useNormalizedBalance(chain, decimals, a.asset);

    if (chain.key === 'acala') {
      const assetId = chain.getAssetId(a.asset);
      return [[acc.address, assetId], { free: balance }];
    }
    return [[acc.address, assetId], { free: balance }];
  });
};

const populateSystem = (chain: Parachain, decimals: number) => {
  const acc = getAccount(chain);
  const free = BALANCE * 10n ** BigInt(decimals);

  return [
    [
      [acc.address],
      {
        providers: 1,
        data: { free: free },
      },
    ],
  ];
};
