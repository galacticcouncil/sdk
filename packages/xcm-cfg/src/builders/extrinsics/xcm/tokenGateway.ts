import {
  addr,
  EvmChain,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
  Hyperbridge as Hb,
  AnyChain,
} from '@galacticcouncil/xcm-core';

const pallet = 'tokenGateway';

type HyperbridgeOpts = {
  custodialChain: AnyChain;
};

const teleport = (opts: HyperbridgeOpts): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, sender, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'teleport',
      getArgs: async (func) => {
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as EvmChain;

        const rcvHb = Hb.fromChain(rcv);

        const assetId = ctx.getAssetId(asset);
        const redeem = opts.custodialChain === rcv;
        return [
          {
            assetId: assetId,
            destination: { Evm: rcv.id },
            recepient: addr.h160ToH256(address),
            amount: amount,
            timeout: 0,
            tokenGateway: rcvHb.getGateway(),
            relayerFee: 0n,
            redeem: redeem,
          },
        ];
      },
    }),
});

export const tokenGateway = () => {
  return {
    teleport,
  };
};
