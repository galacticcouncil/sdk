import { hub, MultiAddress } from '@galacticcouncil/descriptors';
import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xc-core';

const pallet = 'Assets';

const transfer = (): ExtrinsicConfigBuilder => {
  const func = 'transfer';
  return {
    build: async ({ asset, amount, address, destination }) => {
      const rcv = destination.chain as Parachain;

      const { fee } = destination;

      const amountIn = amount > fee.amount ? amount - fee.amount : amount;
      const assetIn = rcv.getMetadataAssetId(asset);

      return new ExtrinsicConfig({
        module: pallet,
        func,
        getTx: (client) => {
          return client.getTypedApi(hub).tx.Assets.transfer({
            id: Number(assetIn),
            target: MultiAddress.Id(address),
            amount: amountIn,
          });
        },
      });
    },
  };
};

export const assets = () => {
  return {
    transfer,
  };
};
