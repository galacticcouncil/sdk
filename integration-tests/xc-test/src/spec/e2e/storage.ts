import {
  addr,
  Asset,
  Parachain,
  ParachainAssetData,
} from '@galacticcouncil/xc-core';
import { acc, big } from '@galacticcouncil/common';

import { getAddress } from './account';
import { findNestedKey } from '../../utils/json';

const BALANCE = 10_000n;

const { Ss58Addr } = addr;

/**
 * Chains using the Tokens pallet (ORML-based, Hydration)
 */
const TOKENS_CHAINS = ['hydration', 'bifrost', 'interlay'];

/**
 * Chains using the Assets pallet (Substrate assets pallet)
 */
const ASSETS_CHAINS = ['assethub', 'assethub_cex', 'astar'];

/**
 * Chains using the ForeignAssets pallet
 */
const FOREIGN_ASSETS_CHAINS = [
  'assethub',
  'assethub_cex',
];

/**
 * Chains using the OrmlTokens pallet (named `ormlTokens` in runtime)
 */
const ORML_TOKENS_CHAINS: string[] = [];

/**
 * Chains with EVM account pallet
 */
const EVM_CHAINS = ['moonbeam', 'hydration', 'laos', 'mythos'];

export const initStorage = (chainDecimals: number, chain: Parachain) => {
  const chainAssets = Array.from(chain.assetsData.values());
  const address = getAddress(chain);

  let storage: Record<string, any> = {
    System: {
      Account: populateSystem(address, chainDecimals),
    },
  };

  // Single asset (system only)
  if (chainAssets.length === 1) {
    return storage;
  }

  if (TOKENS_CHAINS.includes(chain.key)) {
    storage = Object.assign(
      {
        Tokens: {
          Accounts: populateTokens(address, chain, chainAssets, chainDecimals),
        },
      },
      storage
    );
  }

  if (ASSETS_CHAINS.includes(chain.key)) {
    storage = Object.assign(
      {
        Assets: {
          Account: populateAssets(address, chain, chainAssets, chainDecimals),
        },
      },
      storage
    );
  }

  if (FOREIGN_ASSETS_CHAINS.includes(chain.key)) {
    const foreignAssets = populateForeignAssets(
      address,
      chain,
      chainAssets,
      chainDecimals
    );

    // Add 1000 KSM to AssetHub Hydration SA reserve
    const ksm = chain.getAsset('ksm');
    if (ksm && chain.key === 'assethub') {
      const hydrationSaPub = acc.getSovereignAccounts(2034);
      const hydrationSa = Ss58Addr.encodePubKey(
        hydrationSaPub.generic,
        chain.ss58Format
      );

      foreignAssets.push([
        [chain.getAssetXcmLocation(ksm), hydrationSa],
        { balance: 1_000_000_000_000_000n },
      ]);
    }

    storage = Object.assign(
      {
        ForeignAssets: {
          Account: foreignAssets,
        },
      },
      storage
    );
  }

  if (ORML_TOKENS_CHAINS.includes(chain.key)) {
    storage = Object.assign(
      {
        OrmlTokens: {
          Accounts: populateOrmlTokens(
            address,
            chain,
            chainAssets,
            chainDecimals
          ),
        },
      },
      storage
    );
  }

  if (EVM_CHAINS.includes(chain.key)) {
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
  address: string,
  chain: Parachain,
  assets: ParachainAssetData[],
  decimals: number
) => {
  return assets
    .filter((a) => !!a.id)
    .filter((a) => !a.id?.toString().startsWith('0x'))
    .map((a) => {
      const assetId = chain.getBalanceAssetId(a.asset);
      const balance = useNormalizedBalance(chain, decimals, a.asset);
      return [[assetId, address], { balance: balance }];
    });
};

const populateForeignAssets = (
  address: string,
  chain: Parachain,
  assets: ParachainAssetData[],
  decimals: number
) => {
  return assets
    .filter((a) => !!a.xcmLocation)
    .filter(
      (a) =>
        findNestedKey(a.xcmLocation, 'Parachain') ||
        findNestedKey(a.xcmLocation, 'GlobalConsensus')
    )
    .map((a) => {
      const assetLocation = chain.getAssetXcmLocation(a.asset);
      const balance = useNormalizedBalance(chain, decimals, a.asset);
      return [[assetLocation, address], { balance: balance }];
    });
};

const populateOrmlTokens = (
  address: string,
  chain: Parachain,
  assets: ParachainAssetData[],
  decimals: number
) => {
  return assets
    .filter((a) => !!a.xcmLocation)
    .map((a) => {
      const assetId = chain.getBalanceAssetId(a.asset);
      const balance = useNormalizedBalance(chain, decimals, a.asset);
      return [[address, assetId], { free: balance }];
    });
};

const populateTokens = (
  address: string,
  chain: Parachain,
  assets: ParachainAssetData[],
  decimals: number
) => {
  return assets.map((a) => {
    const assetId = chain.getBalanceAssetId(a.asset);
    const balance = useNormalizedBalance(chain, decimals, a.asset);
    return [[address, assetId], { free: balance }];
  });
};

const populateSystem = (address: string, decimals: number) => {
  const free = BALANCE * 10n ** BigInt(decimals);

  return [
    [
      [address],
      {
        providers: 1,
        data: { free: free },
      },
    ],
  ];
};
