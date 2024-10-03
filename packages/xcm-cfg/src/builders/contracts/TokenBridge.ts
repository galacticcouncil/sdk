import {
  ContractConfig,
  ContractConfigBuilder,
  EvmParachain,
  Parachain,
  Precompile,
  Wormhole,
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
        const ctxWh = source.chain as Wormhole;
        const rcvWh = via as Wormhole;
        const recipient = Precompile.Bridge;
        const assetId = source.chain.getAssetId(asset);
        const payload = createMRLPayload(
          destination.chain as Parachain,
          address
        );
        return new ContractConfig({
          address: ctxWh.getTokenBridge(),
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
    const ctx = via || source.chain;
    const ctxWh = ctx as Wormhole;
    const rcvWh = destination.chain as Wormhole;

    const assetId = ctx.getAssetId(asset);
    return new ContractConfig({
      address: ctxWh.getTokenBridge(),
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

const wrapAndTransferETHWithPayload = () => {
  return {
    mrl: (): ContractConfigBuilder => ({
      build: (params) => {
        const { address, source, destination, via } = params;
        mrlGuard(via);
        const ctxWh = source.chain as Wormhole;
        const rcvWh = via as Wormhole;
        const recipient = Precompile.Bridge;
        const payload = createMRLPayload(
          destination.chain as Parachain,
          address
        );
        return new ContractConfig({
          address: ctxWh.getTokenBridge(),
          args: [
            rcvWh.getWormholeId(),
            formatDestAddress(recipient) as `0x${string}`,
            '0',
            payload.toHex(),
          ],
          func: 'wrapAndTransferETHWithPayload',
          module: 'TokenBridge',
        });
      },
    }),
  };
};

export const TokenBridge = () => {
  return {
    transferTokens,
    transferTokensWithPayload,
    wrapAndTransferETHWithPayload,
  };
};
