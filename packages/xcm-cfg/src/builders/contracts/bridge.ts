import { Precompile, Wormhole, WormholeChain } from '@galacticcouncil/xcm-core';
import {
  ContractConfig,
  ContractConfigBuilder,
} from '@moonbeam-network/xcm-builder';
import { createMRLPayload } from './bridge.utils';

import { formatDestAddress } from '../utils';

export function Bridge() {
  return {
    mrlViaWormhole: (from: WormholeChain): ContractConfigBuilder => ({
      build: ({ address, amount, asset, destination }) => {
        const recipientChain = Wormhole.Moonbeam.id;
        const recipient = Precompile.Bridge;
        return new ContractConfig({
          address: from.tokenBridge,
          args: [
            asset,
            amount,
            recipientChain,
            formatDestAddress(recipient) as `0x${string}`,
            '0',
            createMRLPayload(destination.parachainId, address),
          ],
          func: 'transferTokensWithPayload',
          module: 'Bridge',
        });
      },
    }),
  };
}
