import {
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  Wormhole as Wh,
} from '@galacticcouncil/xcm-core';

import { parseAssetId } from '../utils';

export function Erc20() {
  return {
    approve: (
      getSpender: (ctx: Wh) => string | undefined
    ): ContractConfigBuilder => ({
      build: async (params) => {
        const { amount, asset, source, transact } = params;
        const ctx = transact ? transact.chain : source.chain;
        const ctxWh = Wh.fromChain(ctx);
        const assetId = ctx.getAssetId(asset);

        return new ContractConfig({
          abi: Abi.Erc20,
          address: parseAssetId(assetId).toString(),
          args: [getSpender(ctxWh), amount],
          func: 'approve',
          module: 'Erc20',
        });
      },
    }),
  };
}
