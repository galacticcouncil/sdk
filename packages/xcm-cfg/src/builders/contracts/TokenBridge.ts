import {
  ContractConfig,
  ContractConfigBuilder,
  EvmParachain,
  Parachain,
  Precompile,
  WormholeChain,
} from '@galacticcouncil/xcm-core';

import { createMRLPayload } from './TokenBridge.utils';

import { formatDestAddress, parseAssetId } from '../utils';

function mrlGuard(via: EvmParachain | undefined) {
  if (via?.key !== 'moonbeam') {
    throw new Error('Mrl transfer supported only via moonbeam');
  }
}

const transferTokensWithPayload = () => {
  return {
    mrl: (): ContractConfigBuilder => ({
      build: (params) => {
        const { address, amount, asset, source, destination, via } = params;
        mrlGuard(via);
        const ctxWh = source as WormholeChain;
        const rcvWh = via as WormholeChain;
        const recipient = Precompile.Bridge;
        const assetId = source.getAssetId(asset);
        const payload = createMRLPayload(destination as Parachain, address);
        return new ContractConfig({
          address: ctxWh.getWormholeBridge(),
          args: [
            parseAssetId(assetId),
            amount,
            rcvWh.getWormholeId(),
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

const transferTokens = (): ContractConfigBuilder => ({
  build: (params) => {
    const { address, amount, asset, source, destination, via } = params;
    const ctx = via || source;
    const ctxWh = ctx as WormholeChain;
    const rcvWh = destination as WormholeChain;

    const assetId = ctx.getAssetId(asset);
    return new ContractConfig({
      address: ctxWh.getWormholeBridge(),
      args: [
        parseAssetId(assetId),
        amount,
        rcvWh.getWormholeId(),
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
