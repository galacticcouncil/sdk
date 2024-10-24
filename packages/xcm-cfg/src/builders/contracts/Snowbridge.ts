import {
  addr,
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  EvmChain,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { parseAssetId } from '../utils';

const SNOWBRIDGE_GATEWAY = '0x27ca963C279c93801941e1eB8799c23f407d68e7';

const sendToken = (): ContractConfigBuilder => ({
  build: (params) => {
    const { address, amount, asset, source, destination } = params;
    const ctx = source.chain as EvmChain;
    const rcv = destination.chain as Parachain;

    const assetId = ctx.getAssetId(asset);

    return new ContractConfig({
      abi: Abi.Snowbridge,
      address: SNOWBRIDGE_GATEWAY,
      args: [
        parseAssetId(assetId),
        rcv.parachainId,
        [1, addr.toHex(address) as `0x${string}`],
        '0',
        amount,
      ],
      func: 'sendToken',
      module: 'Snowbridge',
    });
  },
});

export const Snowbridge = () => {
  return {
    sendToken,
  };
};
