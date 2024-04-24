import {
  ContractConfig,
  ContractConfigBuilder,
  WormholeChain,
} from '@galacticcouncil/xcm-core';

import { parseAssetId } from '../utils';

export function Erc20() {
  return {
    approve: (): ContractConfigBuilder => ({
      build: (params) => {
        const { amount, asset, source, via } = params;
        const ctx = via || source;
        const ctxWh = ctx as WormholeChain;
        const assetId = ctx.getAssetId(asset);
        return new ContractConfig({
          address: parseAssetId(assetId).toString(),
          args: [ctxWh.getWormholeBridge(), amount],
          func: 'approve',
          module: 'Erc20',
        });
      },
    }),
  };
}
