import { ContractConfig, Precompile } from '@galacticcouncil/xcm-core';

export function isNativeEthBridge(config: ContractConfig): boolean {
  return config.func === 'wrapAndTransferETHWithPayload';
}

export function isPrecompile(config: ContractConfig): boolean {
  const precompiles = Object.entries(Precompile).map(([_, v]) => v);
  return precompiles.includes(config.address);
}
