import {
  addr,
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  Wormhole,
} from '@galacticcouncil/xcm-core';

import { wormholeOrError } from './check';
import { parseAssetId } from '../../utils';

const transferTokensWithRelay = (): ContractConfigBuilder => ({
  build: (params) => {
    const { address, amount, asset, source, destination, transact } = params;
    const ctx = transact ? transact.chain : source.chain;
    const rcv = destination.chain;

    wormholeOrError(ctx);
    wormholeOrError(rcv);

    const ctxWh = ctx as Wormhole;
    const rcvWh = rcv as Wormhole;

    const assetId = ctx.getAssetId(asset);
    return new ContractConfig({
      abi: Abi.TokenRelayer,
      address: ctxWh.getTokenRelayer()!,
      args: [
        parseAssetId(assetId),
        amount,
        '0',
        rcvWh.getWormholeId(),
        addr.toHex(address) as `0x${string}`,
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
