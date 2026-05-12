import {
  addr,
  Abi,
  Across as AcrossPrimitive,
  ContractConfig,
  ContractConfigBuilder,
  EvmChain,
  Parachain,
} from '@galacticcouncil/xc-core';
import { h160 } from '@galacticcouncil/common';

import {
  XcmV5Junctions,
  XcmV5Junction,
  XcmVersionedLocation,
  XcmVersionedXcm,
} from '@galacticcouncil/descriptors';

import { SizedHex } from 'polkadot-api';
import { Blake2256 } from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';
import { encodeAbiParameters } from 'viem';

import { getXcmCodecs } from '../snowbridge/codec';
import { buildSnowbridgeInboundXcm } from '../../extrinsics/xcm/builder/Snowbridge';
import { ETHEREUM_CHAIN_ID } from '../../extrinsics/xcm/builder/const';

import { parseAssetId } from '../../utils';

const { Ss58Addr } = addr;
const { H160, isEvmAddress } = h160;

const ETHER_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
const FILL_DEADLINE_BUFFER = 600; // 10 minutes
const ZERO_TOPIC =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

/**
 * Across V3 fast-fill on the source L2 → MulticallHandler on Ethereum →
 * Snowbridge V2 `v2_sendMessage` to AssetHub → XCM `InitiateTransfer` to the
 * destination parachain. End-to-end via Snowfork's deployed `SnowbridgeL2Adaptor`.
 *
 * The XCM bytes and SendParams encoding match the Snowbridge V2 builder
 * (`../snowbridge/index.ts`) because the same `v2_sendMessage` call runs
 * inside the L2 adaptor's multicall on Ethereum.
 */
const sendTokenAndCall = (): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, sender, source, destination } = params;

    const src = source.chain as EvmChain;
    const rcv = destination.chain as Parachain;
    const across = AcrossPrimitive.fromChain(src);

    const l2Adaptor = across.getSnowbridgeL2Adaptor();
    if (!l2Adaptor) {
      throw new Error(
        `${src.name} has no SnowbridgeL2Adaptor configured; Across-Snowbridge requires Snowfork's L2 adaptor on the source chain.`
      );
    }

    const inputTokenId = src.getAssetId(asset);
    const inputToken = parseAssetId(inputTokenId) as `0x${string}`;
    const isNativeTransfer = asset.originSymbol === 'ETH';
    // On the Ethereum leg the canonical token is the same — Across fills the
    // output token there before the multicall hands it to the Gateway.
    const outputToken = inputToken;

    // Hydration users may pass either a substrate SS58 address or an EVM
    // H160. Convert H160 to its SS58 mapping first so the pubkey extract
    // produces the AccountId32 the destination chain holds tokens under.
    const ss58 = isEvmAddress(address) ? H160.toAccount(address) : address;
    const beneficiaryHex = Ss58Addr.getPubKey(ss58) as string;

    // Topic ties the originating deposit to the resulting XCM journey.
    const entropy = new TextEncoder().encode(
      `${rcv.parachainId}${sender}${inputToken}${beneficiaryHex}${amount}${Date.now()}`
    );
    const topic = toHex(Blake2256(entropy)) as SizedHex<32>;

    // Fee breakdown is populated by the FeeAmountBuilder for this route.
    const acrossFee = destination.feeBreakdown['acrossRelayerFee'] ?? 0n;
    const executionFee = destination.feeBreakdown['executionFee'] ?? 0n;
    const relayerFee = destination.feeBreakdown['relayerFee'] ?? 0n;
    const remoteEtherFee = destination.feeBreakdown['remoteEtherFee'] ?? 0n;
    const remoteDotFee = destination.feeBreakdown['remoteDotFee'];
    const swapInputAmount = destination.feeBreakdown['swapInputAmount'] ?? 0n;

    const xcmInstructions = buildSnowbridgeInboundXcm({
      ethChainId: ETHEREUM_CHAIN_ID,
      destinationParaId: rcv.parachainId,
      tokenAddress: isNativeTransfer ? ETHER_TOKEN_ADDRESS : inputToken,
      beneficiaryHex,
      tokenAmount: amount,
      remoteEtherFeeAmount: remoteEtherFee,
      remoteDotFeeAmount: remoteDotFee,
      topic,
    });

    const codecs = await getXcmCodecs();
    const xcm = toHex(
      codecs.message.enc(XcmVersionedXcm.V5(xcmInstructions))
    ) as `0x${string}`;

    const assets: `0x${string}`[] = [];
    if (!isNativeTransfer) {
      assets.push(
        encodeAbiParameters(
          [{ type: 'uint8' }, { type: 'address' }, { type: 'uint128' }],
          [0, inputToken, amount]
        )
      );
    }

    const claimerVersioned = codecs.location.enc(
      XcmVersionedLocation.V5({
        parents: 0,
        interior: XcmV5Junctions.X1(
          XcmV5Junction.AccountId32({
            id: beneficiaryHex as SizedHex<32>,
            network: undefined,
          })
        ),
      })
    );
    const claimer = toHex(claimerVersioned.slice(1)) as `0x${string}`;

    // SwapParams.callData: Uniswap V3 router calldata that converts a portion
    // of the output token to WETH for the Snowbridge v2 fee. Stubbed until
    // we wire a Uniswap quoter via destination.feeBreakdown.
    // TODO(across-snowbridge): produce real Uniswap V3 swap calldata.
    const uniswapRouter = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
    const swapCalldata = '0x' as `0x${string}`;

    const recipientAddr = isEvmAddress(address)
      ? (address as `0x${string}`)
      : (H160.fromAccount(address) as `0x${string}`);

    return new ContractConfig({
      abi: Abi.SnowbridgeL2Adaptor,
      address: l2Adaptor,
      args: [
        {
          inputToken,
          outputToken,
          inputAmount: amount,
          outputAmount: amount - acrossFee,
          destinationChainId: BigInt(ETHEREUM_CHAIN_ID),
          fillDeadlineBuffer: FILL_DEADLINE_BUFFER,
        },
        {
          inputAmount: swapInputAmount,
          router: uniswapRouter,
          callData: swapCalldata,
        },
        {
          xcm,
          assets,
          claimer,
          executionFee,
          relayerFee,
        },
        recipientAddr,
        ZERO_TOPIC,
      ],
      func: 'sendTokenAndCall',
      module: 'AcrossSnowbridge',
    });
  },
});

export const Snowbridge = () => {
  return {
    sendTokenAndCall,
  };
};
