import { Abi, EvmChain, FeeConfigBuilder } from '@galacticcouncil/xcm-core';

export function FeeBuilder() {
  return {
    TokenRelayer,
  };
}

function TokenRelayer() {
  return {
    calculateRelayerFee: (): FeeConfigBuilder => ({
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
