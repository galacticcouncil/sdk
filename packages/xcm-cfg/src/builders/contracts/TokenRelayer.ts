import {
  ContractConfig,
  ContractConfigBuilder,
  WormholeChain,
} from '@galacticcouncil/xcm-core';

import { createMRLPayload } from './TokenBridge.utils';

import { formatDestAddress, parseAssetId } from '../utils';

const transferTokensWithRelay = (): ContractConfigBuilder => ({
  build: (params) => {
    const { address, amount, asset, source, destination, via } = params;
    const ctx = via || source;
    const ctxWh = ctx as WormholeChain;
    const rcvWh = destination as WormholeChain;

    const assetId = ctx.getAssetId(asset);
    return new ContractConfig({
      address: ctxWh.getTokenRelayer()!,
      args: [
        parseAssetId(assetId),
        amount,
        '0',
        rcvWh.getWormholeId(),
        formatDestAddress(address) as `0x${string}`,
        '0',
      ],
      func: 'transferTokensWithRelay',
      module: 'TokenRelayer',
    });
  },
});

export const TokenRelayer = () => {
  return {
    transferTokensWithRelay,
  };
};
