import { ExternalAsset } from '@galacticcouncil/sdk';
import { Asset, ChainAssetData } from '@galacticcouncil/xcm-core';

export function toAsset(external: ExternalAsset): Asset {
  const { id, origin, symbol } = external;
  const key = symbol.toLowerCase();
  return new Asset({
    key: [key, origin, id].join('_'),
    originSymbol: symbol,
  });
}

export function toHubAsset(external: ExternalAsset): ChainAssetData {
  const { decimals, id } = external;
  return {
    asset: toAsset(external),
    decimals: decimals,
    id: id,
    xcmLocation: {
      parents: 0,
      interior: {
        X2: [
          {
            PalletInstance: 50,
          },
          {
            GeneralIndex: id,
          },
        ],
      },
    },
  } as ChainAssetData;
}

export function toHydrationAsset(external: ExternalAsset): ChainAssetData {
  const { decimals, id, internalId, origin } = external;
  return {
    asset: toAsset(external),
    decimals: decimals,
    id: internalId,
    xcmLocation: {
      parents: 1,
      interior: {
        X3: [
          {
            Parachain: origin,
          },
          {
            PalletInstance: 50,
          },
          {
            GeneralIndex: id,
          },
        ],
      },
    },
  } as ChainAssetData;
}
