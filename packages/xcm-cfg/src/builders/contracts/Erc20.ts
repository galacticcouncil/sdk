import {
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  Wormhole,
} from '@galacticcouncil/xcm-core';

import { parseAssetId } from '../utils';

export function Erc20() {
  return {
    approve: (): ContractConfigBuilder => ({
      build: (params) => {
        const { amount, asset, destination, source, transact } = params;
        const ctx = transact ? transact.chain : source.chain;
        const rcv = destination.chain;
        const ctxWh = ctx as Wormhole;
        const rcvWh = rcv as Wormhole;
        const assetId = ctx.getAssetId(asset);

        const spender = rcvWh.getTokenRelayer()
          ? ctxWh.getTokenRelayer()
          : ctxWh.getTokenBridge();
        return new ContractConfig({
          abi: Abi.Erc20,
          address: parseAssetId(assetId).toString(),
          args: [spender, amount],
          func: 'approve',
          module: 'Erc20',
        });
      },
    }),
  };
}
