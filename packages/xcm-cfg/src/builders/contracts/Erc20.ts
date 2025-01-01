import {
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  Wormhole as Wh,
} from '@galacticcouncil/xcm-core';

import { parseAssetId } from '../utils';

export function Erc20() {
  return {
    approve: (): ContractConfigBuilder => ({
      build: (params) => {
        const { amount, asset, source, transact } = params;
        const ctx = transact ? transact.chain : source.chain;
        const ctxWh = Wh.fromChain(ctx);
        const assetId = ctx.getAssetId(asset);

        const spender = ctxWh.getTokenRelayer()
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
