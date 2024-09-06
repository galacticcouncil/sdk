import {
  Abi,
  Asset,
  EvmChain,
  FeeAmountConfigBuilder,
  FeeAssetConfigBuilder,
  SubstrateCallConfig,
} from '@galacticcouncil/xcm-core';

import { hdx } from '../assets';

export function FeeAmountBuilder() {
  return {
    TokenRelayer,
  };
}

function TokenRelayer() {
  return {
    calculateRelayerFee: (): FeeAmountConfigBuilder => ({
      build: ({ asset, destination, source, via }) => {
        const ctx = via || (source as EvmChain);
        const rcv = destination as EvmChain;
        const assetId = ctx.getAssetId(asset);
        const assetDecimals = ctx.getAssetDecimals(asset);
        const output = ctx.client.getProvider().readContract({
          abi: Abi.TokenRelayer,
          address: ctx.getTokenRelayer() as `0x${string}`,
          args: [rcv.getWormholeId(), assetId as `0x${string}`, assetDecimals],
          functionName: 'calculateRelayerFee',
        });
        return output as Promise<bigint>;
      },
    }),
  };
}

export function FeeAssetBuilder() {
  return {
    multiTransactionPayment,
  };
}

function multiTransactionPayment(): FeeAssetConfigBuilder {
  return {
    build: ({ address, chain }) =>
      new SubstrateCallConfig({
        chain,
        call: async (): Promise<Asset> => {
          const api = await chain.api;
          const asset =
            await api.query.multiTransactionPayment.accountCurrencyMap(address);
          const assetd = asset.isSome ? asset.toString() : '0';
          const feeAsset = chain.findAssetById(assetd);
          return feeAsset ? feeAsset.asset : hdx;
        },
      }),
  };
}
