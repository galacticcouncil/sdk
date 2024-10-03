import {
  ContractConfig,
  ContractConfigBuilder,
  Wormhole,
} from '@galacticcouncil/xcm-core';

import { formatDestAddress, parseAssetId } from '../utils';

const transferTokensWithRelay = (): ContractConfigBuilder => ({
  build: (params) => {
    const { address, amount, asset, source, destination, via } = params;
    const ctx = via || source.chain;
    const ctxWh = ctx as Wormhole;
    const rcvWh = destination.chain as Wormhole;

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
