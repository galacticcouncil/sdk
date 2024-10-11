import {
  big,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { toAsset, toDest } from './xTokens.utils';
import {
  getExtrinsicAccount,
  getExtrinsicArgumentVersion,
  getDerivatedAccount,
  XcmVersion,
} from '../ExtrinsicBuilder.utils';

const pallet = 'xTokens';

const transfer = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transfer',
      getArgs: (func) => {
        const rcv = destination.chain as Parachain;
        const assetId = source.chain.getAssetId(asset);
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
            const ctx = source.chain as Parachain;
            const rcv = destination.chain as Parachain;
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
      build: ({ address, amount, asset, destination, source }) =>
        new ExtrinsicConfig({
          module: pallet,
          func: 'transferMultiassets',
          getArgs: () => {
            const ctx = source.chain as Parachain;
            const rcv = destination.chain as Parachain;
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

            if (asset.key === destination.fee.key) {
              return [
                {
                  [version]: assets,
                },
                0,
                toDest(version, rcv, account),
                'Unlimited',
              ];
            }

            const feeAssetId = ctx.getAssetId(destination.fee);
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
                destination.fee.amount
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

const transferMultiCurrencies = (): ExtrinsicConfigBuilder => ({
  build: (params) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transferMulticurrencies',
      getArgs: () => {
        const { amount, asset, destination, source, via } = params;

        let rcv = destination.chain as Parachain;
        let feeAsset = destination.fee;
        let feeAmount = destination.fee.amount;
        if (via && via.fee) {
          rcv = via.chain as Parachain;
          feeAsset = via.fee;
          feeAmount = big.toBigInt(feeAsset.amount, feeAsset.decimals);
        }

        const version = XcmVersion.v3;
        const assetId = source.chain.getAssetId(asset);
        const feeAssetId = source.chain.getAssetId(feeAsset);
        const derivatedAccount = getDerivatedAccount(params);
        const account = getExtrinsicAccount(derivatedAccount);
        return [
          [
            [assetId, amount],
            [feeAssetId, feeAmount],
          ],
          1,
          toDest(version, rcv, account),
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
