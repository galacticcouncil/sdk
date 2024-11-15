import {
  Asset,
  big,
  Parachain,
  ParachainAssetData,
} from '@galacticcouncil/xcm-core';
import { ApiPromise } from '@polkadot/api';

import { getAccount } from './account';

const BALANCE = 1000n;

export const initStorage = async (api: ApiPromise, chain: Parachain) => {
  const chainDecimals = api.registry.chainDecimals[0];
  const chainAssets = Array.from(chain.assetsData.values());

  const system = {
    System: {
      Account: populateSystem(chain, chainDecimals),
    },
  };

  // Single asset (system only)
  if (chainAssets.length === 1) {
    return system;
  }

  if (useTokensPallet(api)) {
    return {
      ...system,
      Tokens: {
        Accounts: populateTokens(chain, chainAssets, chainDecimals),
      },
    };
  }

  if (useAssetsPallet(api)) {
    return {
      ...system,
      Assets: {
        Account: populateAssets(chain, chainAssets, chainDecimals),
      },
    };
  }

  return system;
};

const useAssetsPallet = (api: ApiPromise): boolean => {
  return !!api.query.assets?.account;
};

const useTokensPallet = (api: ApiPromise): boolean => {
  return !!api.query.tokens?.accounts;
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
