import {
  Asset,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { toBigInt } from '@moonbeam-network/xcm-utils';
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
                    Parachain: originParachainId ?? rcv.parachainId,
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
            const assets = [
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
                      GeneralIndex: assetId,
                    },
                  ],
                },
                amount
              ),
            ];

            if (asset.key === fee.key) {
              console.log('fdf');
              return [
                {
                  [version]: assets,
                },
                0,
                toDest(version, rcv, account),
                'Unlimited',
              ];
            }

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

            // Flip asset order if general index greater than fee asset
            if (Number(assetId) > Number(feeAssetId)) {
              return [
                {
                  [version]: assets.reverse(),
                },
                0,
                toDest(version, rcv, account),
                'Unlimited',
              ];
            }

            return [
              {
                [version]: assets,
              },
              1,
              toDest(version, rcv, account),
              'Unlimited',
            ];
          },
        }),
    }),
  };
};

type XTokensOpts = {
  fee: Asset;
  feeAmount: number;
};

const transferMultiCurrencies = (
  opts?: XTokensOpts
): ExtrinsicConfigBuilder => ({
  build: (params) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transferMulticurrencies',
      getArgs: () => {
        const { amount, asset, destination, fee, source, via } = params;

        let feeAssetId = source.getAssetId(fee);
        let feeAmount = fee.amount;
        if (opts) {
          const feeAssetDecimals = source.getAssetDecimals(opts.fee);
          feeAssetId = source.getAssetId(opts.fee);
          feeAmount = toBigInt(opts.feeAmount, feeAssetDecimals!);
        }

        const rcv = destination as Parachain;
        const version = XcmVersion.v3;
        const assetId = source.getAssetId(asset);
        const tAccount = getTransactAccount(params);
        const account = getExtrinsicAccount(tAccount);
        return [
          [
            [assetId, amount],
            [feeAssetId, feeAmount],
          ],
          1,
          toDest(version, via || rcv, account),
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
