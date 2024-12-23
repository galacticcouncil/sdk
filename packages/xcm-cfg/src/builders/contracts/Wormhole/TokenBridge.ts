import {
  addr,
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
            addr.toHex(recipient) as `0x${string}`,
            '0',
            payload,
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
        const payload = mrl.createPayload(
          destination.chain as Parachain,
          address
        );
        return new ContractConfig({
          abi: Abi.TokenBridge,
          address: ctxWh.getTokenBridge(),
          args: [
            rcvWh.getWormholeId(),
            addr.toHex(recipient) as `0x${string}`,
            '0',
            payload,
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

    const assetId = ctx.getAssetId(asset);
    return new ContractConfig({
      abi: Abi.TokenBridge,
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

const wrapAndTransferETH = (): ContractConfigBuilder => ({
  build: (params) => {
    const { address, amount, source, destination } = params;

    const ctxWh = Wh.fromChain(source.chain);
    const rcvWh = Wh.fromChain(destination.chain);

    return new ContractConfig({
      abi: Abi.TokenBridge,
      address: ctxWh.getTokenBridge(),
      args: [
        rcvWh.getWormholeId(),
        addr.toHex(address) as `0x${string}`,
        '0',
        '0',
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
