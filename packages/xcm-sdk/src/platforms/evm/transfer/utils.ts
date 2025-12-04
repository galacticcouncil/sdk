import { ContractConfig, Precompile } from '@galacticcouncil/xcm-core';

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

  const isHyperbridge = config.module === 'Hyperbridge';

  return isWormholeNative || isSnowbridgeNative || isHyperbridge;
}

export function isPrecompile(config: ContractConfig): boolean {
  const precompiles = Object.entries(Precompile).map(([_, v]) => v);
  return precompiles.includes(config.address);
}
