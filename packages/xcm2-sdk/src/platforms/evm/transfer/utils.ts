import { ContractConfig, Precompile } from '@galacticcouncil/xcm2-core';

export function isNativeEthBridge(config: ContractConfig): boolean {
  const isSnowbridgeNative =
    config.module === 'Snowbridge' &&
    config.func === 'sendToken' &&
    config.args[0] === '0x0000000000000000000000000000000000000000';

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
