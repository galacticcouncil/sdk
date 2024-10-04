import {
  AnyParachain,
  ContractConfig,
  ContractConfigBuilder,
  Parachain,
  Precompile,
  Wormhole,
} from '@galacticcouncil/xcm-core';

import { createMRLPayload } from './TokenBridge.utils';

import { formatDestAddress, parseAssetId } from '../utils';

function mrlGuard(via: AnyParachain | undefined) {
  if (via?.key !== 'moonbeam') {
    throw new Error('Mrl transfer supported only via moonbeam');
  }
}

const transferTokensWithPayload = () => {
  return {
    mrl: (): ContractConfigBuilder => ({
      build: (params) => {
        const { address, amount, asset, source, destination, via } = params;
        mrlGuard(via?.chain);
        const ctxWh = source.chain as Wormhole;
        const rcvWh = via?.chain as Wormhole;
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
    const ctx = via?.chain || source.chain;
    const rcv = destination.chain;
    const ctxWh = ctx as Wormhole;
    const rcvWh = rcv as Wormhole;

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
        mrlGuard(via?.chain);
        const ctxWh = source.chain as Wormhole;
        const rcvWh = via?.chain as Wormhole;
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
