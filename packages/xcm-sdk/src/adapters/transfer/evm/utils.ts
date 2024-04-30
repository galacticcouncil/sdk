import { ContractConfig } from '@galacticcouncil/xcm-core';

export function isNativeEthBridge(config: ContractConfig): boolean {
  return config.func === 'wrapAndTransferETHWithPayload';
}
