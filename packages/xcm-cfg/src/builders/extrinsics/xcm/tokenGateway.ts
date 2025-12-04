import {
  EvmChain,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
  Hyperbridge as Hb,
} from '@galacticcouncil/xcm-core';

const pallet = 'tokenGateway';

const teleport = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, sender, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'teleport',
      getArgs: async (func) => {
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as EvmChain;

        const rcvHb = Hb.fromChain(rcv);

        const assetId = ctx.getAssetId(asset);
        return [
          assetId,
          { Evm: rcv.id },
          address,
          amount,
          0,
          rcvHb.getGateway(),
          0,
          false,
        ];
      },
    }),
});

export const tokenGateway = () => {
  return {
    teleport,
  };
};
