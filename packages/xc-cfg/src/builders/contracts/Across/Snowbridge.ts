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
import {
  buildAcrossSnowbridgeSwapCallData,
  fetchAcrossRelayerFee,
  getSwapEntry,
} from './swap';

const { Ss58Addr } = addr;
const { H160, isEvmAddress } = h160;

const ETHER_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
const FILL_DEADLINE_BUFFER = 600; // 10 minutes
const ZERO_TOPIC =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

// Mainnet Uniswap V3 + WETH addresses on Ethereum. Mirrored from
// Snowfork's `constants/Mainnet.sol`. The L2 adaptor's multicall executes
// on Ethereum after Across fast-fill, so these are L1-side addresses.
const ETHEREUM_SWAP_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const ETHEREUM_WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

type CommonBuildInputs = {
  src: EvmChain;
  rcv: Parachain;
  l2Adaptor: string;
  inputToken: `0x${string}`;
  beneficiaryHex: string;
  recipientAddr: `0x${string}`;
  topic: SizedHex<32>;
  xcm: `0x${string}`;
  assets: `0x${string}`[];
  claimer: `0x${string}`;
  executionFee: bigint;
  relayerFee: bigint;
  amount: bigint;
};

async function buildCommonInputs(params: {
  address: string;
  amount: bigint;
  asset: { originSymbol: string };
  sender: string;
  source: { chain: EvmChain };
  destination: {
    chain: Parachain;
    feeBreakdown: { [key: string]: bigint };
  };
  inputToken: `0x${string}`;
  isNativeTransfer: boolean;
}): Promise<CommonBuildInputs> {
  const { address, amount, sender, source, destination, inputToken, isNativeTransfer } =
    params;

  const src = source.chain;
  const rcv = destination.chain;
  const across = AcrossPrimitive.fromChain(src);

  const l2Adaptor = across.getSnowbridgeL2Adaptor();
  if (!l2Adaptor) {
    throw new Error(
      `${src.name} has no SnowbridgeL2Adaptor configured; Across-Snowbridge requires Snowfork's L2 adaptor on the source chain.`
    );
  }

  const ss58 = isEvmAddress(address) ? H160.toAccount(address) : address;
  const beneficiaryHex = Ss58Addr.getPubKey(ss58) as string;

  const entropy = new TextEncoder().encode(
    `${rcv.parachainId}${sender}${inputToken}${beneficiaryHex}${amount}${Date.now()}`
  );
  const topic = toHex(Blake2256(entropy)) as SizedHex<32>;

  const executionFee = destination.feeBreakdown['executionFee'] ?? 0n;
  const relayerFee = destination.feeBreakdown['relayerFee'] ?? 0n;
  const remoteEtherFee = destination.feeBreakdown['remoteEtherFee'] ?? 0n;
  const remoteDotFee = destination.feeBreakdown['remoteDotFee'];

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

  const recipientAddr = isEvmAddress(address)
    ? (address as `0x${string}`)
    : (H160.fromAccount(address) as `0x${string}`);

  return {
    src,
    rcv,
    l2Adaptor,
    inputToken,
    beneficiaryHex,
    recipientAddr,
    topic,
    xcm,
    assets,
    claimer,
    executionFee,
    relayerFee,
    amount,
  };
}

/**
 * Resolve the Across relayer fee — prefer the value pre-computed and stashed
 * in `feeBreakdown.acrossRelayerFee` (test path, or future async fee builder),
 * otherwise hit Across `/suggested-fees` directly with the actual amount.
 */
async function resolveAcrossFee(args: {
  feeBreakdown: { [k: string]: bigint };
  inputToken: string;
  outputToken: string;
  originChainId: number;
  destinationChainId: number;
  amount: bigint;
}): Promise<bigint> {
  const override = args.feeBreakdown['acrossRelayerFee'];
  if (override !== undefined) return override;
  return await fetchAcrossRelayerFee({
    inputToken: args.inputToken,
    outputToken: args.outputToken,
    originChainId: args.originChainId,
    destinationChainId: args.destinationChainId,
    amount: args.amount,
  });
}

/**
 * Across V3 fast-fill on the source L2 → MulticallHandler on Ethereum →
 * Snowbridge V2 `v2_sendMessage` to AssetHub → XCM `InitiateTransfer` to
 * Hydration. Uses Snowfork's `SnowbridgeL2Adaptor.sendTokenAndCall` and
 * swaps a portion of the bridged ERC20 to WETH on Uniswap V3 to fund the
 * Snowbridge inbound fee.
 */
const sendTokenAndCall = (): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, sender, source, destination } = params;
    const src = source.chain as EvmChain;
    const rcv = destination.chain as Parachain;

    const inputTokenId = src.getAssetId(asset);
    const inputToken = parseAssetId(inputTokenId) as `0x${string}`;

    const swapEntry = getSwapEntry(src.id, inputToken);
    if (!swapEntry) {
      throw new Error(
        `No Across-Snowbridge swap mapping registered for ${asset.originSymbol} on chain ${src.id} (${inputToken}). Add it to swap.ts SWAP_REGISTRY or use sendEtherAndCall.`
      );
    }

    const swapInputAmount =
      destination.feeBreakdown['swapInputAmount'] ?? 0n;

    // Across relayer fee is amount-dependent — fetched here with the actual
    // transfer amount. Honored override in feeBreakdown for tests / pre-quoting.
    // Across must carry the bridged amount + swap input across to Ethereum.
    const acrossFee = await resolveAcrossFee({
      feeBreakdown: destination.feeBreakdown,
      inputToken,
      outputToken: swapEntry.swapTokenAddress,
      originChainId: src.id,
      destinationChainId: ETHEREUM_CHAIN_ID,
      amount: amount + swapInputAmount,
    });

    const inputs = await buildCommonInputs({
      address,
      amount,
      asset: { originSymbol: asset.originSymbol },
      sender,
      source: { chain: src },
      destination: {
        chain: rcv,
        feeBreakdown: destination.feeBreakdown,
      },
      inputToken,
      isNativeTransfer: false,
    });

    // amountOut for the swap = ETH needed for Snowbridge inbound fee.
    // outputAmount of Across deposit = amount - across fee - swap input
    // (the swap consumes part of the bridged token on Ethereum).
    const outputAmount = amount - acrossFee - swapInputAmount;

    const swapCallData = buildAcrossSnowbridgeSwapCallData({
      router: ETHEREUM_SWAP_ROUTER as `0x${string}`,
      tokenIn: swapEntry.swapTokenAddress,
      tokenOut: ETHEREUM_WETH as `0x${string}`,
      swapFee: swapEntry.swapFee,
      recipient: AcrossPrimitive.fromChain(src).getMulticallHandler() as `0x${string}`,
      amountOut: inputs.executionFee + inputs.relayerFee,
      amountInMaximum: swapInputAmount,
    });

    return new ContractConfig({
      abi: Abi.SnowbridgeL2Adaptor,
      address: inputs.l2Adaptor,
      args: [
        {
          inputToken,
          outputToken: swapEntry.swapTokenAddress,
          inputAmount: amount,
          outputAmount,
          destinationChainId: BigInt(ETHEREUM_CHAIN_ID),
          fillDeadlineBuffer: FILL_DEADLINE_BUFFER,
        },
        {
          inputAmount: swapInputAmount,
          router: ETHEREUM_SWAP_ROUTER,
          callData: swapCallData,
        },
        {
          xcm: inputs.xcm,
          assets: inputs.assets,
          claimer: inputs.claimer,
          executionFee: inputs.executionFee,
          relayerFee: inputs.relayerFee,
        },
        inputs.recipientAddr,
        ZERO_TOPIC,
      ],
      func: 'sendTokenAndCall',
      module: 'AcrossSnowbridge',
    });
  },
});

/**
 * Across V3 ETH/WETH path — same flow as sendTokenAndCall but no Uniswap
 * swap leg, since the bridged asset is already WETH (which the multicall
 * unwraps to native ETH for the Snowbridge fee).
 *
 * The user pays the Snowbridge inbound fee from their bridged ETH amount;
 * Across delivers WETH on Ethereum, the multicall withdraws ETH and the
 * Gateway is called with `msg.value`. The remaining ETH is wrapped back
 * implicitly on AssetHub as `Ether` for the inbound XCM.
 */
const sendEtherAndCall = (): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, sender, source, destination } = params;
    const src = source.chain as EvmChain;
    const rcv = destination.chain as Parachain;

    const inputTokenId = src.getAssetId(asset);
    const inputToken = parseAssetId(inputTokenId) as `0x${string}`;

    const inputs = await buildCommonInputs({
      address,
      amount,
      asset: { originSymbol: asset.originSymbol },
      sender,
      source: { chain: src },
      destination: {
        chain: rcv,
        feeBreakdown: destination.feeBreakdown,
      },
      inputToken,
      isNativeTransfer: true,
    });

    // For the ETH path, the canonical L1 token is WETH on Ethereum.
    const acrossFee = await resolveAcrossFee({
      feeBreakdown: destination.feeBreakdown,
      inputToken,
      outputToken: ETHEREUM_WETH,
      originChainId: src.id,
      destinationChainId: ETHEREUM_CHAIN_ID,
      amount,
    });

    // For the ETH path, the Across deposit carries the full amount, the
    // adaptor unwraps WETH locally on Ethereum, and the user receives ETH
    // minus the Snowbridge fees on Hydration.
    const totalOutputAmount =
      amount - acrossFee - inputs.executionFee - inputs.relayerFee;

    return new ContractConfig({
      abi: Abi.SnowbridgeL2Adaptor,
      address: inputs.l2Adaptor,
      args: [
        {
          inputToken,
          outputToken: ETHEREUM_WETH,
          inputAmount: amount,
          outputAmount: totalOutputAmount,
          destinationChainId: BigInt(ETHEREUM_CHAIN_ID),
          fillDeadlineBuffer: FILL_DEADLINE_BUFFER,
        },
        {
          xcm: inputs.xcm,
          assets: inputs.assets,
          claimer: inputs.claimer,
          executionFee: inputs.executionFee,
          relayerFee: inputs.relayerFee,
        },
        inputs.recipientAddr,
        ZERO_TOPIC,
      ],
      // `sendEtherAndCall` is payable; if the user transfers native ETH
      // rather than WETH on the source chain, msg.value must equal amount.
      value: asset.originSymbol === 'ETH' ? amount : 0n,
      func: 'sendEtherAndCall',
      module: 'AcrossSnowbridge',
    });
  },
});

export const Snowbridge = () => {
  return {
    sendTokenAndCall,
    sendEtherAndCall,
  };
};
