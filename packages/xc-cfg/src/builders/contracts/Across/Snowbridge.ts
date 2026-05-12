import {
  Abi,
  Across as AcrossPrimitive,
  ContractConfig,
  ContractConfigBuilder,
  EvmChain,
  Parachain,
} from '@galacticcouncil/xc-core';
import { h160 } from '@galacticcouncil/common';
import { AccountId } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { parseAssetId } from '../../utils';

const { H160, isEvmAddress } = h160;

const ETHEREUM_CHAIN_ID = 1n;
const FILL_DEADLINE_BUFFER = 600; // 10 minutes
const ZERO_TOPIC =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

/**
 * Encode beneficiary as bytes for the SendParams.claimer field, which
 * Snowfork's L2 adaptor delivers to AssetHub as the XCM beneficiary location.
 *
 * H160 EVM addresses arrive as AccountKey20; raw SS58/AccountId32 arrives as
 * AccountId32. See Snowbridge `accountToLocation` and erc20ToParachain.ts.
 */
function toClaimerBytes(address: string): `0x${string}` {
  if (isEvmAddress(address)) {
    // AccountKey20: prefix 0x00 (no parents/network) + 0x0101 (X1 interior)
    // + 0x03 (AccountKey20 variant) + 20-byte address + 0x00 (network=None)
    // Layout follows Snowfork's L2 adaptor encoding for EVM-style accounts.
    return ('0x000103' + address.slice(2).toLowerCase() + '00') as `0x${string}`;
  }
  const ss58Bytes = AccountId().enc(address);
  // AccountId32: 0x00 (parents=0) + 0x0101 (X1) + 0x00 (AccountId32 variant)
  // + 32-byte id + 0x00 (network=None)
  return ('0x000100' +
    toHex(ss58Bytes).slice(2) +
    '00') as `0x${string}`;
}

/**
 * STUB: build the Hydration-bound XCM bytes passed in SendParams.xcm.
 *
 * The full XCM construction lives in Snowfork's
 * `@snowbridge/api/dist/xcmbuilders/toPolkadot/erc20ToParachain.sendMessageXCM`
 * but it requires a polkadot.js Registry (older `@polkadot/types`), which
 * conflicts with xc-core's `polkadot-api` stack.
 *
 * Follow-up PR will either:
 *   (a) port the InitiateTransfer construction to polkadot-api + descriptors
 *       (mirrors `xc-core/src/utils/mrl.createPayload`), or
 *   (b) bring in a small @polkadot/types bridge.
 *
 * Until that lands, this returns a placeholder so consumers can wire builders
 * and routes; calldata produced will NOT execute end-to-end yet.
 */
function buildHydrationBoundXcm(_params: {
  destination: Parachain;
  recipient: string;
  asset: string;
  amount: bigint;
  remoteEtherFee: bigint;
}): `0x${string}` {
  // TODO(across-snowbridge): replace with sendMessageXCM(...).toHex()
  return '0x' as `0x${string}`;
}

/**
 * STUB: build the SendParams.assets list (encoded XCM assets that travel
 * alongside the message — typically the Ether-for-fees and the bridged ERC20).
 */
function buildSendAssets(_params: {
  asset: string;
  amount: bigint;
  ether: bigint;
}): `0x${string}`[] {
  // TODO(across-snowbridge): SCALE-encode V5 Asset entries.
  return [];
}

/**
 * STUB: build SwapParams.callData — the Uniswap V3 router callData that
 * swaps a portion of the output token to WETH so the multicall can fund the
 * Snowbridge `v2_sendMessage` ETH fee.
 */
function buildUniswapSwapCalldata(_params: {
  router: string;
  inputToken: string;
  outputAmount: bigint;
}): `0x${string}` {
  // TODO(across-snowbridge): produce real Uniswap V3 swap calldata.
  return '0x' as `0x${string}`;
}

const sendTokenAndCall = (): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, source, destination } = params;

    const src = source.chain as EvmChain;
    const dst = destination.chain as Parachain;
    const across = AcrossPrimitive.fromChain(src);

    const l2Adaptor = across.getSnowbridgeL2Adaptor();
    if (!l2Adaptor) {
      throw new Error(
        `${src.name} has no SnowbridgeL2Adaptor configured; Across-Snowbridge requires Snowfork's L2 adaptor on the source chain.`
      );
    }

    const inputTokenId = src.getAssetId(asset);
    const inputToken = parseAssetId(inputTokenId) as `0x${string}`;
    const outputToken = inputToken; // same canonical token on the Ethereum hop

    // Fee breakdown is populated by the FeeAmountBuilder (Across() chain).
    const acrossFee = destination.feeBreakdown['acrossRelayerFee'] ?? 0n;
    const executionFee = destination.feeBreakdown['snowbridgeExecutionFee'] ?? 0n;
    const relayerFee = destination.feeBreakdown['snowbridgeRelayerFee'] ?? 0n;
    const remoteEtherFee =
      destination.feeBreakdown['hydrationExecutionFee'] ?? 0n;
    const swapInputAmount = destination.feeBreakdown['swapInputAmount'] ?? 0n;

    const xcm = buildHydrationBoundXcm({
      destination: dst,
      recipient: address,
      asset: inputToken,
      amount,
      remoteEtherFee,
    });

    const assets = buildSendAssets({
      asset: inputToken,
      amount,
      ether: remoteEtherFee,
    });

    const claimer = toClaimerBytes(address);

    // Uniswap router on Base/Arb/OP. For now hardcoded to Uniswap V3 SwapRouter
    // until a per-chain `swapRouter` field is added to chain configs.
    const uniswapRouter = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
    const swapCalldata = buildUniswapSwapCalldata({
      router: uniswapRouter,
      inputToken,
      outputAmount: executionFee + relayerFee,
    });

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
          destinationChainId: ETHEREUM_CHAIN_ID,
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
