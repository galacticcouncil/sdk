import {
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  Wormhole as Wh,
} from '@galacticcouncil/xcm2-core';

import { parseAssetId } from '../../utils';

const transferTokensWithRelay = (): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, source, destination, transact } = params;
    const ctx = transact ? transact.chain : source.chain;
    const rcv = destination.chain;

    const ctxWh = Wh.fromChain(ctx);
    const rcvWh = Wh.fromChain(rcv);

    const toNativeTokenAmount = 0;
    const batchId = 0;

    const assetId = ctx.getAssetId(asset);
    return new ContractConfig({
      abi: Abi.TokenRelayer,
      address: ctxWh.getTokenRelayer()!,
      args: [
        parseAssetId(assetId),
        amount,
        toNativeTokenAmount,
        rcvWh.getWormholeId(),
        rcvWh.normalizeAddress(address),
        batchId,
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
