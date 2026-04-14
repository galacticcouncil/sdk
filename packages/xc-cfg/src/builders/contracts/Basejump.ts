import {
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  EvmChain,
} from '@galacticcouncil/xc-core';

import { parseAssetId } from '../utils';
import { h160 } from '@galacticcouncil/common';
import { AccountId } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

const { H160, isEvmAddress } = h160;

/**
 * Convert any address (H160 or SS58) to bytes32 AccountId.
 */
function toAccountId32(address: string): `0x${string}` {
  const ss58 = isEvmAddress(address) ? H160.toAccount(address) : address;
  return toHex(AccountId().enc(ss58)) as `0x${string}`;
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
        toAccountId32(address),
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
