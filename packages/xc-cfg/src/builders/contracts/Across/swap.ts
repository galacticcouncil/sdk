import { Abi } from '@galacticcouncil/xc-core';
import { encodeFunctionData } from 'viem';

/**
 * Per-asset swap config consumed by the Across-Snowbridge L2 adaptor multicall
 * on Ethereum: maps a source-L2 ERC20 address to its Ethereum canonical token
 * and the Uniswap V3 pool fee tier used to swap a portion into WETH for the
 * Snowbridge `v2_sendMessage` ether fee.
 *
 * Keyed by L2 chain id + lowercase L2 token address. Extend as routes land.
 * Mirrors the Snowfork registry's `assets[l2Token].swapTokenAddress`/`swapFee`.
 */
export type SwapAssetEntry = {
  swapTokenAddress: `0x${string}`;
  swapFee: number;
};

const SWAP_REGISTRY: Record<number, Record<string, SwapAssetEntry>> = {
  // Base (8453)
  8453: {
    // USDC: Base native USDC → Ethereum USDC, 0.05% pool
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
      swapTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      swapFee: 500,
    },
  },
  // Arbitrum (42161)
  42161: {
    // USDC (native)
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831': {
      swapTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      swapFee: 500,
    },
  },
  // Optimism (10)
  10: {
    // USDC (native)
    '0x0b2c639c533813f4aa9d7837caf62653d097ff85': {
      swapTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      swapFee: 500,
    },
  },
};

export function getSwapEntry(
  l2ChainId: number,
  l2TokenAddress: string
): SwapAssetEntry | undefined {
  return SWAP_REGISTRY[l2ChainId]?.[l2TokenAddress.toLowerCase()];
}

export type SwapCallDataParams = {
  router: `0x${string}`;
  tokenIn: `0x${string}`; // L1 canonical token (post-Across-fill on Ethereum)
  tokenOut: `0x${string}`; // L1 fee token (WETH)
  swapFee: number; // Uniswap V3 pool fee tier
  recipient: `0x${string}`; // L1 MulticallHandler
  amountOut: bigint; // ETH amount needed (Snowbridge fees)
  amountInMaximum: bigint; // From off-chain Quoter, padded
  deadlineSeconds?: number; // Defaults to 10 minutes from now
};

const ACROSS_API_BASE = 'https://app.across.to/api';

export type AcrossSuggestedFeeParams = {
  inputToken: string; // L2 source token
  outputToken: string; // L1 token (post-Across-fill on Ethereum)
  originChainId: number;
  destinationChainId: number;
  amount: bigint;
  apiBaseUrl?: string;
};

/**
 * Queries Across `/suggested-fees` for the relayer fee at a given input
 * amount. Across relayer fee scales with amount; this is called at contract
 * build time (where amount is known), not at fee-quote time.
 *
 * Returns 0n on any failure so the deposit can still be built; the relayer
 * may then simply not fill at zero fee — slow fill recovers the user funds.
 */
export async function fetchAcrossRelayerFee(
  params: AcrossSuggestedFeeParams
): Promise<bigint> {
  const base = params.apiBaseUrl ?? ACROSS_API_BASE;
  const url =
    `${base}/suggested-fees` +
    `?inputToken=${params.inputToken}` +
    `&outputToken=${params.outputToken}` +
    `&originChainId=${params.originChainId}` +
    `&destinationChainId=${params.destinationChainId}` +
    `&amount=${params.amount}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return 0n;
    const data = (await res.json()) as {
      totalRelayFee?: { total?: string };
    };
    const total = data.totalRelayFee?.total;
    return total ? BigInt(total) : 0n;
  } catch {
    return 0n;
  }
}

export function buildAcrossSnowbridgeSwapCallData(
  params: SwapCallDataParams
): `0x${string}` {
  const deadline = BigInt(
    Math.floor(Date.now() / 1000) + (params.deadlineSeconds ?? 600)
  );
  return encodeFunctionData({
    abi: Abi.UniswapV3SwapRouter,
    functionName: 'exactOutputSingle',
    args: [
      {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        fee: params.swapFee,
        recipient: params.recipient,
        deadline,
        amountOut: params.amountOut,
        amountInMaximum: params.amountInMaximum,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });
}
