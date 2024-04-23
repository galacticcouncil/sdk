import {
  ContractConfig,
  ContractConfigBuilder,
  Wormhole,
} from '@galacticcouncil/xcm-core';

import { parseAssetId } from '../utils';

export function Erc20() {
  return {
    approve: (): ContractConfigBuilder => ({
      build: (params) => {
        const { amount, asset, source, transactVia } = params;
        const ctx = transactVia ?? source;
        const assetId = ctx.getAssetId(asset);
        const from = Wormhole[ctx.key];

        return new ContractConfig({
          address: parseAssetId(assetId).toString(),
          args: [from.tokenBridge, amount],
          func: 'approve',
          module: 'Erc20',
        });
      },
    }),
  };
}
