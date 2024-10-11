import {
  addr,
  ContractConfig,
  ContractConfigBuilder,
  Parachain,
  Precompile,
  Wormhole,
} from '@galacticcouncil/xcm-core';

import { parseAssetId } from '../utils';

const transferTokensWithPayload = (
  createPayload: (dest: Parachain, address: string) => string
): ContractConfigBuilder => ({
  build: (params) => {
    const { address, amount, asset, source, destination, via } = params;
    const ctxWh = source.chain as Wormhole;
    const rcvWh = via?.chain as Wormhole;
    const recipient = Precompile.Bridge;
    const assetId = source.chain.getAssetId(asset);
    const payload = createPayload(destination.chain as Parachain, address);
    return new ContractConfig({
      address: ctxWh.getTokenBridge(),
      args: [
        parseAssetId(assetId),
        amount,
        rcvWh.getWormholeId(),
        addr.toHex(recipient) as `0x${string}`,
        '0',
        payload,
      ],
      func: 'transferTokensWithPayload',
      module: 'TokenBridge',
    });
  },
});

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
        addr.toHex(address) as `0x${string}`,
        '0',
        '0',
      ],
      func: 'transferTokens',
      module: 'TokenBridge',
    });
  },
});

const wrapAndTransferETHWithPayload = (
  createPayload: (dest: Parachain, address: string) => string
): ContractConfigBuilder => ({
  build: (params) => {
    const { address, source, destination, via } = params;
    const ctxWh = source.chain as Wormhole;
    const rcvWh = via?.chain as Wormhole;
    const recipient = Precompile.Bridge;
    const payload = createPayload(destination.chain as Parachain, address);
    return new ContractConfig({
      address: ctxWh.getTokenBridge(),
      args: [
        rcvWh.getWormholeId(),
        addr.toHex(recipient) as `0x${string}`,
        '0',
        payload,
      ],
      func: 'wrapAndTransferETHWithPayload',
      module: 'TokenBridge',
    });
  },
});

export const TokenBridge = () => {
  return {
    transferTokens,
    transferTokensWithPayload,
    wrapAndTransferETHWithPayload,
  };
};
