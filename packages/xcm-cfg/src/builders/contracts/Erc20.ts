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
        const { amount, asset, destination, source, via } = params;
        const ctx = via?.chain || source.chain;
        const ctxWh = ctx as Wormhole;
        const rcvWh = destination.chain as Wormhole;
        const assetId = ctx.getAssetId(asset);

        const spender = rcvWh.getTokenRelayer()
          ? ctxWh.getTokenRelayer()
          : ctxWh.getTokenBridge();
        return new ContractConfig({
          address: parseAssetId(assetId).toString(),
          args: [spender, amount],
          func: 'approve',
          module: 'Erc20',
        });
      },
    }),
  };
}
