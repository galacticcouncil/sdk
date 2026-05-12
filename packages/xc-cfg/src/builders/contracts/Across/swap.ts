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
