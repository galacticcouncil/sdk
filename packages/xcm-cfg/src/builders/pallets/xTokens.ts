import { ExtrinsicConfigBuilderV2 } from '@galacticcouncil/xcm-core';
import { XcmVersion, ExtrinsicConfig } from '@moonbeam-network/xcm-builder';
import { toAsset, toDest } from './xTokens.utils';
import {
  getExtrinsicAccount,
  getExtrinsicArgumentVersion,
} from '../ExtrinsicBuilder.utils';

const pallet = 'xTokens';

const transfer = (): ExtrinsicConfigBuilderV2 => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transfer',
      getArgs: (func) => {
        const assetId = source.getAssetId(asset);
        const version = getExtrinsicArgumentVersion(func, 2);
        const account = getExtrinsicAccount(address);
        return [
          assetId,
          amount,
          toDest(version, destination, account),
          'Unlimited',
        ];
      },
    }),
});

const transferMultiasset = (originParachainId?: number) => {
  return {
    X3: (): ExtrinsicConfigBuilderV2 => ({
      build: ({ address, amount, asset, destination, source }) =>
        new ExtrinsicConfig({
          module: pallet,
          func: 'transferMultiasset',
          getArgs: () => {
            const assetId = source.getAssetId(asset);
            const palletInstance = source.getAssetPalletInstance(asset);
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            const assets = toAsset(
              {
                X3: [
                  {
                    Parachain: originParachainId ?? destination.parachainId,
                  },
                  {
                    PalletInstance: palletInstance,
                  },
                  {
                    GeneralIndex: assetId,
                  },
                ],
              },
              amount
            );
            return [
              {
                [version]: assets,
              },
              toDest(version, destination, account),
              'Unlimited',
            ];
          },
        }),
    }),
  };
};

const transferMultiassets = (originParachainId?: number) => {
  return {
    X3: (): ExtrinsicConfigBuilderV2 => ({
      build: ({ address, amount, asset, destination, fee, source }) =>
        new ExtrinsicConfig({
          module: pallet,
          func: 'transferMultiassets',
          getArgs: () => {
            const assetId = source.getAssetId(asset);
            const palletInstance = source.getAssetPalletInstance(asset);
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            const isAssetDifferent = !!fee && asset.key !== fee.key;
            const assets = [
              toAsset(
                {
                  X3: [
                    {
                      Parachain: originParachainId ?? destination.parachainId,
                    },
                    {
                      PalletInstance: palletInstance,
                    },
                    {
                      GeneralIndex: assetId,
                    },
                  ],
                },
                amount
              ),
            ];

            if (isAssetDifferent) {
              const feeAssetId = source.getAssetId(fee);
              assets.push(
                toAsset(
                  {
                    X3: [
                      {
                        Parachain: originParachainId ?? destination.parachainId,
                      },
                      {
                        PalletInstance: palletInstance,
                      },
                      {
                        GeneralIndex: feeAssetId,
                      },
                    ],
                  },
                  fee.amount
                )
              );
            }

            return [
              {
                [version]: assets,
              },
              isAssetDifferent ? 1 : 0,
              toDest(version, destination, account),
              'Unlimited',
            ];
          },
        }),
    }),
  };
};

const transferMultiCurrencies = (): ExtrinsicConfigBuilderV2 => ({
  build: ({ address, amount, asset, destination, fee, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transferMulticurrencies',
      getArgs: () => {
        const assetId = source.getAssetId(asset);
        const feeAssetId = source.getAssetId(fee);
        const version = XcmVersion.v3;
        const account = getExtrinsicAccount(address);
        return [
          [
            [assetId, amount],
            [feeAssetId, fee.amount],
          ],
          1,
          toDest(version, destination, account),
          'Unlimited',
        ];
      },
    }),
});

export const xTokens = () => {
  return {
    transfer,
    transferMultiasset,
    transferMultiassets,
    transferMultiCurrencies,
  };
};
