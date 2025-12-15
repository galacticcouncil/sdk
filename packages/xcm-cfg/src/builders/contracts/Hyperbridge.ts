import {
  addr,
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  EvmChain,
  Parachain,
  Hyperbridge as Hb,
  AnyChain,
} from '@galacticcouncil/xcm-core';

const { Ss58Addr } = addr;

type HyperbridgeOpts = {
  custodialChain: AnyChain;
};

const teleport = (opts: HyperbridgeOpts): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, source, destination } = params;
    const ctx = source.chain as EvmChain;
    const rcv = destination.chain as Parachain;

    const ctxHb = Hb.fromChain(ctx);

    const to = Ss58Addr.getPubKey(address);
    const assetId = ctxHb.getAssetId(asset.originSymbol);
    const dest = ctxHb.getDest(rcv);
    const redeem = opts.custodialChain === rcv;

    const nativeCost = destination.fee.amount;
    const timeout = 6 * 60 * 60;

    return new ContractConfig({
      abi: Abi.Hyperbridge,
      address: ctxHb.getGateway(),
      args: [
        [
          amount,
          0n, // relayer fee set to 0 for substrate
          assetId,
          redeem,
          to,
          dest,
          timeout,
          nativeCost,
          '0x',
        ],
      ],
      value: nativeCost,
      func: 'teleport',
      module: 'Hyperbridge',
    });
  },
});

export const Hyperbridge = () => {
  return {
    teleport,
  };
};
