import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm2-core';

const pallet = 'assets';

const transfer = (): ExtrinsicConfigBuilder => {
  const func = 'transfer';
  return {
    build: ({ asset, amount, address, destination }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: async () => {
          const rcv = destination.chain as Parachain;

          const { fee } = destination;

          const amountIn = amount > fee.amount ? amount - fee.amount : amount;
          const assetIn = rcv.getMetadataAssetId(asset);

          return [assetIn, address, amountIn];
        },
      }),
  };
};

export const assets = () => {
  return {
    transfer,
  };
};
