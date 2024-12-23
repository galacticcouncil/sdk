import {
  addr,
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  EvmChain,
  Parachain,
  Snowbridge as Sb,
} from '@galacticcouncil/xcm-core';

import { parseAssetId } from '../utils';

const sendToken = (): ContractConfigBuilder => ({
  build: (params) => {
    const { address, amount, asset, source, destination } = params;
    const ctx = source.chain as EvmChain;
    const rcv = destination.chain as Parachain;

    const ctxSb = Sb.fromChain(ctx);

    const assetId = ctx.getAssetId(asset);
    return new ContractConfig({
      abi: Abi.Snowbridge,
      address: ctxSb.getGateway(),
      args: [
        parseAssetId(assetId),
        rcv.parachainId,
        [1, addr.getPubKey(address) as `0x${string}`],
        ctxSb.getBridgeFee(),
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
