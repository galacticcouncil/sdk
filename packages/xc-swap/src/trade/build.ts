import { CallType } from '@galacticcouncil/xc-core';
import type { EvmCall } from '@galacticcouncil/xc-sdk';

import { encodeFunctionData } from 'viem';

import { ERC20_APPROVE_ABI, SWAP_AND_BRIDGE_ABI } from './abi';

export interface BuildCallsParams {
  /** `from` of both calls — the Hydration EVM account initiating the swap. */
  from: string;
  /** ERC-20 precompile address of asset A on Hydration EVM. */
  assetInAddress: `0x${string}`;
  /** `IntentEmitter` proxy address. */
  emitter: string;
  /** Hydration runtime asset id of A. */
  assetIn: number;
  /** Amount of A to swap (smallest unit). */
  amountIn: bigint;
  /** Slippage floor on the bridged WETH. */
  minEthOut: bigint;
  /** Upper bound of A spent buying the GLMR fee. */
  maxFeeIn: bigint;
  /** UI correlation hash carried in the bridge payload. */
  intentId: `0x${string}`;
  /** Ethereum deposit address the bridged ETH lands at. */
  intentDepositAddress: string;
  /** Relay fee ceiling carried in the payload. */
  maxRelayFee: bigint;
}

/**
 * Build the two executable EVM calls on Hydration EVM:
 *   1. `approve(emitter, amountIn)` on A's ERC-20 precompile.
 *   2. `swapAndBridge(...)` on the `IntentEmitter`.
 */
export function buildCalls(params: BuildCallsParams): EvmCall[] {
  const approveData = encodeFunctionData({
    abi: ERC20_APPROVE_ABI,
    functionName: 'approve',
    args: [params.emitter as `0x${string}`, params.amountIn],
  });

  const swapData = encodeFunctionData({
    abi: SWAP_AND_BRIDGE_ABI,
    functionName: 'swapAndBridge',
    args: [
      params.assetIn,
      params.amountIn,
      params.minEthOut,
      params.maxFeeIn,
      params.intentId,
      params.intentDepositAddress as `0x${string}`,
      params.maxRelayFee,
    ],
  });

  const approve: EvmCall = {
    from: params.from,
    to: params.assetInAddress,
    data: approveData,
    type: CallType.Evm,
    allowance: params.amountIn,
    dryRun: async () => undefined,
  };

  const swapAndBridge: EvmCall = {
    from: params.from,
    to: params.emitter as `0x${string}`,
    data: swapData,
    type: CallType.Evm,
    dryRun: async () => undefined,
  };

  return [approve, swapAndBridge];
}
