import {
  ContractConfigBuilderV2,
  Precompile,
  Wormhole,
  WormholeChain,
} from '@galacticcouncil/xcm-core';
import { ContractConfig } from '@moonbeam-network/xcm-builder';
import { ChainAssetId } from '@moonbeam-network/xcm-types';

import { createMRLPayload } from './TokenBridge.utils';

import { formatDestAddress, parseAssetId } from '../utils';

const transferTokensWithPayload = () => {
  return {
    mrl: (): ContractConfigBuilderV2 => ({
      build: (params) => {
        const { address, amount, asset, source, destination } = params;

        const from = Wormhole[source.key];
        const to = Wormhole.moonbeam;
        const recipient = Precompile.Bridge;
        const assetId = source.getAssetId(asset);
        const payload = createMRLPayload(destination.parachainId, address);
        return new ContractConfig({
          address: from.tokenBridge,
          args: [
            parseAssetId(assetId),
            amount,
            to.id,
            formatDestAddress(recipient) as `0x${string}`,
            '0',
            payload.toHex(),
          ],
          func: 'transferTokensWithPayload',
          module: 'TokenBridge',
        });
      },
    }),
  };
};

const transferTokens = (): ContractConfigBuilderV2 => ({
  build: (params) => {
    const { address, amount, asset, source, destination, transactVia } = params;
    const ctx = transactVia ?? source;
    const assetId = ctx.getAssetId(asset);
    const from = Wormhole[ctx.key];
    const to = Wormhole[destination.key];

    return new ContractConfig({
      address: from.tokenBridge,
      args: [
        parseAssetId(assetId),
        amount,
        to.id,
        formatDestAddress(address) as `0x${string}`,
        '0',
        '0',
      ],
      func: 'transferTokens',
      module: 'TokenBridge',
    });
  },
});

export const TokenBridge = () => {
  return {
    transferTokens,
    transferTokensWithPayload,
  };
};
