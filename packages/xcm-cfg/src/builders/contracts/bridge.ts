import {
  ContractConfigBuilderParamsV2,
  Precompile,
  Wormhole,
  WormholeId,
} from '@galacticcouncil/xcm-core';

import {
  ContractConfig,
  ContractConfigBuilder,
} from '@moonbeam-network/xcm-builder';
import { createMRLPayload } from './bridge.utils';

import { formatDestAddress, parseAssetId } from '../utils';

export function Bridge() {
  return {
    transferViaMrl: (): ContractConfigBuilder => ({
      build: (params) => {
        const { address, amount, asset, source, destination } =
          params as ContractConfigBuilderParamsV2;

        const from = Wormhole[source.key as WormholeId];
        const to = Wormhole.moonbeam;
        const recipient = Precompile.Bridge;
        const assetId = parseAssetId(asset);
        const payload = createMRLPayload(destination.parachainId, address);
        return new ContractConfig({
          address: from.tokenBridge,
          args: [
            assetId,
            amount,
            to.id,
            formatDestAddress(recipient) as `0x${string}`,
            '0',
            payload.toHex(),
          ],
          func: 'transferTokensWithPayload',
          module: 'Bridge',
        });
      },
    }),
    transfer: (): ContractConfigBuilder => ({
      build: (params) => {
        const { address, amount, asset, source, destination } =
          params as ContractConfigBuilderParamsV2;

        const from = Wormhole[source.key as WormholeId];
        const to = Wormhole[destination.key as WormholeId];
        const assetId = parseAssetId(asset);
        return new ContractConfig({
          address: from.tokenBridge,
          args: [
            assetId,
            amount,
            to.id,
            formatDestAddress(address) as `0x${string}`,
            '0',
            '0',
          ],
          func: 'transferTokens',
          module: 'Bridge',
        });
      },
    }),
  };
}
