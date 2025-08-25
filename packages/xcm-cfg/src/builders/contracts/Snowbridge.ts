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

const { Ss58Addr } = addr;

const sendToken = (): ContractConfigBuilder => ({
  build: (params) => {
    const { address, amount, asset, source, destination } = params;
    const ctx = source.chain as EvmChain;
    const rcv = destination.chain as Parachain;

    const ctxSb = Sb.fromChain(ctx);

    const assetId = ctx.getAssetId(asset);
    const parsedAssetId = parseAssetId(assetId);

    const isNativeTransfer = asset.originSymbol === 'ETH';

    const bridgeFeeInDot = destination.feeBreakdown['bridgeFeeInDot'];
    const bridgeFeeInWei = destination.fee.amount;

    return new ContractConfig({
      abi: Abi.Snowbridge,
      address: ctxSb.getGateway(),
      args: [
        parsedAssetId,
        rcv.parachainId,
        [1, Ss58Addr.getPubKey(address) as `0x${string}`],
        bridgeFeeInDot,
        amount,
      ],
      value: isNativeTransfer ? bridgeFeeInWei + amount : bridgeFeeInWei,
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
