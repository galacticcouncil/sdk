import {
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  EvmParachain,
  Parachain,
  Precompile,
  Wormhole as Wh,
} from '@galacticcouncil/xcm-core';

import { mrl, parseAssetId } from '../../utils';

type TransferMrlOpts = {
  moonchain: EvmParachain;
};

const transferTokensWithPayload = () => {
  return {
    viaMrl: (opts: TransferMrlOpts): ContractConfigBuilder => ({
      build: (params) => {
        const { address, amount, asset, source, destination } = params;

        const ctxWh = Wh.fromChain(source.chain);
        const rcvWh = Wh.fromChain(opts.moonchain);

        const recipient = Precompile.Bridge;
        const assetId = source.chain.getAssetId(asset);
        const nonce = 0;
        const payload = mrl.createPayload(
          destination.chain as Parachain,
          address
        );
        return new ContractConfig({
          abi: Abi.TokenBridge,
          address: ctxWh.getTokenBridge(),
          args: [
            parseAssetId(assetId),
            amount,
            rcvWh.getWormholeId(),
            rcvWh.normalizeAddress(recipient),
            nonce,
            payload.toHex(),
          ],
          func: 'transferTokensWithPayload',
          module: 'TokenBridge',
        });
      },
    }),
  };
};

const wrapAndTransferETHWithPayload = () => {
  return {
    viaMrl: (opts: TransferMrlOpts): ContractConfigBuilder => ({
      build: (params) => {
        const { address, amount, source, destination } = params;

        const ctxWh = Wh.fromChain(source.chain);
        const rcvWh = Wh.fromChain(opts.moonchain);

        const recipient = Precompile.Bridge;
        const nonce = 0;
        const payload = mrl.createPayload(
          destination.chain as Parachain,
          address
        );

        return new ContractConfig({
          abi: Abi.TokenBridge,
          address: ctxWh.getTokenBridge(),
          args: [
            rcvWh.getWormholeId(),
            rcvWh.normalizeAddress(recipient),
            nonce,
            payload.toHex(),
          ],
          value: amount,
          func: 'wrapAndTransferETHWithPayload',
          module: 'TokenBridge',
        });
      },
    }),
  };
};

const transferTokens = (): ContractConfigBuilder => ({
  build: (params) => {
    const { address, amount, asset, source, destination, transact } = params;
    const ctx = transact ? transact.chain : source.chain;
    const rcv = destination.chain;

    const ctxWh = Wh.fromChain(ctx);
    const rcvWh = Wh.fromChain(rcv);

    const arbiterFee = 0;
    const nonce = 0;

    const assetId = ctx.getAssetId(asset);
    return new ContractConfig({
      abi: Abi.TokenBridge,
      address: ctxWh.getTokenBridge(),
      args: [
        parseAssetId(assetId),
        amount,
        rcvWh.getWormholeId(),
        rcvWh.normalizeAddress(address),
        arbiterFee,
        nonce,
      ],
      func: 'transferTokens',
      module: 'TokenBridge',
    });
  },
});

const wrapAndTransferETH = (): ContractConfigBuilder => ({
  build: (params) => {
    const { address, amount, source, destination } = params;

    const ctxWh = Wh.fromChain(source.chain);
    const rcvWh = Wh.fromChain(destination.chain);

    const arbiterFee = 0;
    const nonce = 0;

    return new ContractConfig({
      abi: Abi.TokenBridge,
      address: ctxWh.getTokenBridge(),
      args: [
        rcvWh.getWormholeId(),
        rcvWh.normalizeAddress(address),
        arbiterFee,
        nonce,
      ],
      value: amount,
      func: 'wrapAndTransferETH',
      module: 'TokenBridge',
    });
  },
});

export const TokenBridge = () => {
  return {
    transferTokens,
    transferTokensWithPayload,
    wrapAndTransferETH,
    wrapAndTransferETHWithPayload,
  };
};
