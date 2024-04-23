import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { toAsset, toDest } from './xTokens.utils';
import {
  getExtrinsicAccount,
  getExtrinsicArgumentVersion,
  getTransactAccount,
  XcmVersion,
} from '../ExtrinsicBuilder.utils';

const pallet = 'xTokens';

const transfer = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transfer',
      getArgs: (func) => {
        const rcv = destination as Parachain;
        const assetId = source.getAssetId(asset);
        const version = getExtrinsicArgumentVersion(func, 2);
        const account = getExtrinsicAccount(address);
        return [assetId, amount, toDest(version, rcv, account), 'Unlimited'];
      },
    }),
});

const transferMultiasset = (originParachainId?: number) => {
  return {
    X3: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, asset, destination, source }) =>
        new ExtrinsicConfig({
          module: pallet,
          func: 'transferMultiasset',
          getArgs: () => {
            const ctx = source as Parachain;
            const rcv = destination as Parachain;
            const assetId = ctx.getAssetId(asset);
            const palletInstance = ctx.getAssetPalletInstance(asset);
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            const assets = toAsset(
              {
                X3: [
                  {
                    Parachain: originParachainId ?? ctx.parachainId,
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
              toDest(version, rcv, account),
              'Unlimited',
            ];
          },
        }),
    }),
  };
};

const transferMultiassets = (originParachainId?: number) => {
  return {
    X3: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, asset, destination, fee, source }) =>
        new ExtrinsicConfig({
          module: pallet,
          func: 'transferMultiassets',
          getArgs: () => {
            const ctx = source as Parachain;
            const rcv = destination as Parachain;
            const assetId = ctx.getAssetId(asset);
            const palletInstance = ctx.getAssetPalletInstance(asset);
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            const isAssetDifferent = !!fee && asset.key !== fee.key;
            const assets = [
              toAsset(
                {
                  X3: [
                    {
                      Parachain: originParachainId ?? ctx.parachainId,
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
              const feeAssetId = ctx.getAssetId(fee);
              assets.push(
                toAsset(
                  {
                    X3: [
                      {
                        Parachain: originParachainId ?? rcv.parachainId,
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
              toDest(version, rcv, account),
              'Unlimited',
            ];
          },
        }),
    }),
  };
};

const transferMultiCurrencies = (): ExtrinsicConfigBuilder => ({
  build: (params) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transferMulticurrencies',
      getArgs: () => {
        const { amount, asset, destination, fee, source, transactVia } = params;
        const rcv = destination as Parachain;
        const version = XcmVersion.v3;
        const assetId = source.getAssetId(asset);
        const feeAssetId = source.getAssetId(fee);
        const account = getTransactAccount(params);
        return [
          [
            [assetId, amount],
            [feeAssetId, fee.amount],
          ],
          1,
          toDest(version, transactVia || rcv, account),
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
