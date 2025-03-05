import {
  Abi,
  Asset,
  EvmChain,
  FeeAmountConfigBuilder,
  Parachain,
  Snowbridge as Sb,
  Wormhole as Wh,
} from '@galacticcouncil/xcm-core';

import { AssethubClient } from '../clients';

function TokenRelayer() {
  return {
    calculateRelayerFee: (): FeeAmountConfigBuilder => ({
      build: ({ asset, destination, source }) => {
        const ctx = source as EvmChain;
        const rcv = destination as EvmChain;

        const ctxWh = Wh.fromChain(ctx);
        const rcvWh = Wh.fromChain(rcv);

        const assetId = ctx.getAssetId(asset);
        const assetDecimals = ctx.getAssetDecimals(asset);
        const output = ctx.client.getProvider().readContract({
          abi: Abi.TokenRelayer,
          address: ctxWh.getTokenRelayer() as `0x${string}`,
          args: [
            rcvWh.getWormholeId(),
            assetId as `0x${string}`,
            assetDecimals,
          ],
          functionName: 'calculateRelayerFee',
        });
        return output as Promise<bigint>;
      },
    }),
  };
}

function Wormhole() {
  return {
    TokenRelayer,
  };
}

type SendFeeOpts = {
  hub: Parachain;
};

function Snowbridge() {
  return {
    quoteSendTokenFee: (): FeeAmountConfigBuilder => ({
      build: ({ asset, destination, source }) => {
        const ctx = source as EvmChain;
        const rcv = destination as Parachain;

        const ctxSb = Sb.fromChain(ctx);

        const assetId = ctx.getAssetId(asset);
        const output = ctx.client.getProvider().readContract({
          abi: Abi.Snowbridge,
          address: ctxSb.getGateway() as `0x${string}`,
          args: [
            assetId as `0x${string}`,
            rcv.parachainId,
            ctxSb.getBridgeFee(),
          ],
          functionName: 'quoteSendTokenFee',
        });
        return output as Promise<bigint>;
      },
    }),
    getSendFee: (opts: SendFeeOpts): FeeAmountConfigBuilder => ({
      build: () => {
        const client = new AssethubClient(opts.hub);
        const fee = client.getBridgeFee();
        return fee as Promise<bigint>;
      },
    }),
  };
}

export function FeeAmountBuilder() {
  return {
    Snowbridge,
    Wormhole,
  };
}
