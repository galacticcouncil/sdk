import { ExternalAsset } from '@galacticcouncil/sdk-next';
import { Asset, ChainAssetData } from '@galacticcouncil/xc-core';

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
        type: 'X2',
        value: [
          {
            type: 'PalletInstance',
            value: 50,
          },
          {
            type: 'GeneralIndex',
            value: id,
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
        type: 'X3',
        value: [
          {
            type: 'Parachain',
            value: origin,
          },
          {
            type: 'PalletInstance',
            value: 50,
          },
          {
            type: 'GeneralIndex',
            value: id,
          },
        ],
      },
    },
  } as ChainAssetData;
}
