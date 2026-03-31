import {
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  EvmChain,
} from '@galacticcouncil/xc-core';

import { parseAssetId } from '../utils';
import { h160 } from '@galacticcouncil/common';

const { H160 } = h160;

/**
 * Pad H160 address to bytes32 (left-pad with zeros).
 */
function toBytes32(h160: `0x${string}`): `0x${string}` {
  const addr = h160.replace('0x', '').toLowerCase();
  return `0x${'0'.repeat(24)}${addr}` as `0x${string}`;
}

const bridgeViaWormhole = (): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, source } = params;
    const ctx = source.chain as EvmChain;

    const assetId = ctx.getAssetId(asset);

    const basejumpAddress = ctx.getBasejump();
    if (!basejumpAddress) {
      throw new Error(`Basejump not configured for ${ctx.name}`);
    }

    return new ContractConfig({
      abi: Abi.Basejump,
      address: basejumpAddress,
      args: [
        parseAssetId(assetId),
        amount,
        toBytes32(H160.fromAccount(address) as `0x${string}`),
      ],
      func: 'bridgeViaWormhole',
      module: 'Basejump',
    });
  },
});

export const Basejump = () => {
  return {
    bridgeViaWormhole,
  };
};
