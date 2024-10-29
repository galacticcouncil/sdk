import {
  addr,
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  EvmChain,
  Parachain,
  Snowbridge as bridge,
} from '@galacticcouncil/xcm-core';

import { parseAssetId } from '../utils';

const sendToken = (): ContractConfigBuilder => ({
  build: (params) => {
    const { address, amount, asset, source, destination } = params;
    const ctx = source.chain as EvmChain;
    const rcv = destination.chain as Parachain;
    const destFeeInDOT = 100_000_000n;

    const assetId = ctx.getAssetId(asset);
    return new ContractConfig({
      abi: Abi.Snowbridge,
      address: bridge.Gateway,
      args: [
        parseAssetId(assetId),
        rcv.parachainId,
        [1, addr.getPubKey(address) as `0x${string}`],
        destFeeInDOT,
        amount,
      ],
      value: destination.fee.amount,
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
