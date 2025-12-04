import {
  addr,
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  EvmChain,
  Parachain,
  Hyperbridge as Hb,
} from '@galacticcouncil/xcm-core';

const { Ss58Addr } = addr;

const teleport = (): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, source, destination } = params;
    const ctx = source.chain as EvmChain;
    const rcv = destination.chain as Parachain;

    const ctxHb = Hb.fromChain(ctx);

    const to = Ss58Addr.getPubKey(address);
    const assetId = ctxHb.getAssetId(asset.originSymbol);
    const dest = ctxHb.getDest(rcv);

    const nativeCost = 19617600110689n;
    const timeout = 6 * 60 * 60;

    return new ContractConfig({
      abi: Abi.Hyperbridge,
      address: ctxHb.getGateway(),
      args: [
        amount,
        0n, // relayer fee
        assetId,
        true,
        to,
        dest,
        timeout,
        nativeCost,
        '0x',
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
