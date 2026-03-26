import {
  addr,
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  EvmChain,
  Parachain,
  Snowbridge as Sb,
} from '@galacticcouncil/xc-core';

import {
  XcmV5Junctions,
  XcmV5Junction,
  XcmVersionedXcm,
  XcmVersionedLocation,
} from '@galacticcouncil/descriptors';

import { FixedSizeBinary } from 'polkadot-api';
import { Blake2256 } from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';
import { encodeAbiParameters } from 'viem';

import { getXcmCodecs } from './codec';
import { buildSnowbridgeInboundXcm } from '../../extrinsics/xcm/builder/Snowbridge';
import { ETHEREUM_CHAIN_ID } from '../../extrinsics/xcm/builder/const';

import { parseAssetId } from '../../utils';

const { Ss58Addr } = addr;

const ETHER_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

const v2SendMessage = (): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, sender, source, destination } = params;
    const ctx = source.chain as EvmChain;
    const rcv = destination.chain as Parachain;

    const ctxSb = Sb.fromChain(ctx);

    const assetId = ctx.getAssetId(asset);
    const tokenAddress = parseAssetId(assetId) as string;

    const isNativeTransfer = asset.originSymbol === 'ETH';

    const executionFee = destination.feeBreakdown['executionFee'];
    const relayerFee = destination.feeBreakdown['relayerFee'];
    const remoteEtherFee = destination.feeBreakdown['remoteEtherFee'];
    const remoteDotFee = destination.feeBreakdown['remoteDotFee'];
    const bridgeFeeInWei = destination.fee.amount;

    const beneficiaryHex = Ss58Addr.getPubKey(address) as string;
    const entropy = new TextEncoder().encode(
      `${rcv.parachainId}${sender}${tokenAddress}${beneficiaryHex}${amount}${Date.now()}`
    );
    const topic = toHex(Blake2256(entropy));

    const xcmInstructions = buildSnowbridgeInboundXcm({
      ethChainId: ETHEREUM_CHAIN_ID,
      destinationParaId: rcv.parachainId,
      tokenAddress: isNativeTransfer ? ETHER_TOKEN_ADDRESS : tokenAddress,
      beneficiaryHex,
      tokenAmount: amount,
      remoteEtherFeeAmount: remoteEtherFee,
      remoteDotFeeAmount: remoteDotFee,
      topic,
    });

    // SCALE-encode XCM as VersionedXcm.V5 bytes
    const codecs = await getXcmCodecs();
    const xcmBytes = toHex(
      codecs.message.enc(XcmVersionedXcm.V5(xcmInstructions))
    );
    const assets: `0x${string}`[] = [];

    if (!isNativeTransfer) {
      assets.push(
        encodeAbiParameters(
          [{ type: 'uint8' }, { type: 'address' }, { type: 'uint128' }],
          [0, tokenAddress as `0x${string}`, amount]
        )
      );
    }

    const claimerVersioned = codecs.location.enc(
      XcmVersionedLocation.V5({
        parents: 0,
        interior: XcmV5Junctions.X1(
          XcmV5Junction.AccountId32({
            id: FixedSizeBinary.fromHex(beneficiaryHex),
            network: undefined,
          })
        ),
      })
    );
    const claimerBytes = toHex(claimerVersioned.slice(1));

    return new ContractConfig({
      abi: Abi.Snowbridge,
      address: ctxSb.getGateway(),
      args: [xcmBytes, assets, claimerBytes, executionFee, relayerFee],
      value: isNativeTransfer ? bridgeFeeInWei + amount : bridgeFeeInWei,
      func: 'v2_sendMessage',
      module: 'Snowbridge',
    });
  },
});

export const Snowbridge = () => {
  return {
    v2SendMessage,
  };
};
