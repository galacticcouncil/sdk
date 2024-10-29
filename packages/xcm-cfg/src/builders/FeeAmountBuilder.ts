import {
  Abi,
  EvmChain,
  FeeAmountConfigBuilder,
  Parachain,
  Snowbridge as bridge,
} from '@galacticcouncil/xcm-core';

function TokenRelayer() {
  return {
    calculateRelayerFee: (): FeeAmountConfigBuilder => ({
      build: ({ asset, destination, source }) => {
        const ctx = source as EvmChain;
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

function Wormhole() {
  return {
    TokenRelayer,
  };
}

function Snowbridge() {
  return {
    quoteSendTokenFee: (): FeeAmountConfigBuilder => ({
      build: ({ asset, destination, source }) => {
        const ctx = source as EvmChain;
        const rcv = destination as Parachain;
        const assetId = ctx.getAssetId(asset);
        const output = ctx.client.getProvider().readContract({
          abi: Abi.Snowbridge,
          address: bridge.Gateway as `0x${string}`,
          args: [assetId as `0x${string}`, rcv.parachainId, 100_000_000n],
          functionName: 'quoteSendTokenFee',
        });
        return output as Promise<bigint>;
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
