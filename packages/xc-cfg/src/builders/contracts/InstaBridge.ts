import {
  Abi,
  Asset,
  ContractConfig,
  ContractConfigBuilder,
  EvmChain,
  EvmParachain,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import { parseAssetId } from '../utils';
import { h160 } from '@galacticcouncil/common';

const { H160 } = h160;

/**
 * Encode Hydration asset ID to EVM precompile address.
 * Follows HydraErc20Mapping encoding from Hydration runtime.
 */
function toHydrationPrecompile(assetId: number): `0x${string}` {
  const bytes = new Uint8Array(20);
  bytes[15] = 1;
  bytes[16] = (assetId >> 24) & 0xff;
  bytes[17] = (assetId >> 16) & 0xff;
  bytes[18] = (assetId >> 8) & 0xff;
  bytes[19] = assetId & 0xff;
  return ('0x' + Buffer.from(bytes).toString('hex')) as `0x${string}`;
}

type BridgeViaWormholeOpts = {
  destChain: EvmParachain;
  destAsset: Asset;
};

const bridgeViaWormhole = (opts: BridgeViaWormholeOpts): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, source, destination } = params;
    const ctx = source.chain as EvmChain;
    const rcv = destination.chain as EvmParachain;

    const rcvWh = Wh.fromChain(opts.destChain);

    const assetId = ctx.getAssetId(asset);
    const destAssetId = rcv.getAssetId(opts.destAsset);

    const instaBridgeAddress = ctx.getInstaBridge();
    if (!instaBridgeAddress) {
      throw new Error(`InstaBridge not configured for ${ctx.name}`);
    }

    return new ContractConfig({
      abi: Abi.InstaBridge,
      address: instaBridgeAddress,
      args: [
        parseAssetId(assetId),
        amount,
        rcvWh.getWormholeId(),
        toHydrationPrecompile(destAssetId as number),
        H160.fromAccount(address),
      ],
      func: 'bridgeViaWormhole',
      module: 'InstaBridge',
    });
  },
});

export const InstaBridge = () => {
  return {
    bridgeViaWormhole,
  };
};
