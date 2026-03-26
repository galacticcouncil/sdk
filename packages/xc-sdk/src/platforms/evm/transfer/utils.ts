import { ContractConfig, Precompile } from '@galacticcouncil/xc-core';
import { decodeAbiParameters } from 'viem';

export function isSnowbridgeV2(config: ContractConfig): boolean {
  return config.module === 'Snowbridge' && config.func === 'v2_sendMessage';
}

/**
 * Extract the ERC20 token address from Snowbridge V2 assets arg.
s */
export function getSnowbridgeV2TokenAddress(
  config: ContractConfig
): string | undefined {
  if (!isSnowbridgeV2(config)) return undefined;
  const assets = config.args[1] as string[];
  if (!assets || assets.length === 0) return undefined;
  const [_kind, tokenAddress] = decodeAbiParameters(
    [{ type: 'uint8' }, { type: 'address' }, { type: 'uint128' }],
    assets[0] as `0x${string}`
  );
  return tokenAddress as string;
}

export function isNativeEthBridge(config: ContractConfig): boolean {
  const isSnowbridgeNative =
    config.module === 'Snowbridge' &&
    config.func === 'v2_sendMessage' &&
    Array.isArray(config.args[1]) &&
    config.args[1].length === 0;

  const isWormholeNative =
    config.module === 'TokenBridge' &&
    ['wrapAndTransferETHWithPayload', 'wrapAndTransferETH'].includes(
      config.func
    );

  return isWormholeNative || isSnowbridgeNative;
}

export function isPrecompile(config: ContractConfig): boolean {
  const precompiles = Object.entries(Precompile).map(([_, v]) => v);
  return precompiles.includes(config.address);
}
