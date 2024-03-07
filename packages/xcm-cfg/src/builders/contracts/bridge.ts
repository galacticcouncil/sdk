import {
  ContractConfig,
  ContractConfigBuilder,
} from '@moonbeam-network/xcm-builder';
import { createMRLPayload } from './bridge.utils';

export function Bridge() {
  return {
    transferTokensWithPayload: (
      recipientChain: number,
      recipient: string,
      parachainId: number
    ): ContractConfigBuilder => ({
      build: ({ address, amount, asset }) =>
        new ContractConfig({
          args: [
            asset,
            amount,
            recipientChain,
            recipient as `0x${string}`,
            '0',
            createMRLPayload(parachainId, address),
          ],
          func: 'transferTokensWithPayload',
          module: 'Bridge',
        }),
    }),
  };
}
