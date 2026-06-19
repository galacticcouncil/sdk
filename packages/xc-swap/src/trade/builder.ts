import { CallType } from '@galacticcouncil/xc-core';
import type { EvmCall } from '@galacticcouncil/xc-sdk';

import { encodeFunctionData, erc20Abi } from 'viem';

import { SWAP_AND_BRIDGE_ABI } from './abi';
import type { BuildCallsParams } from './types';

/**
 * Build the executable EVM calls on Hydration EVM:
 *   1. `approve(emitter, amountIn)` on A's ERC-20 precompile — skipped when
 *      `approved` (the emitter already has sufficient allowance).
 *   2. `swapAndBridge(...)` on the `IntentEmitter`.
 */
export function buildCalls(params: BuildCallsParams): EvmCall[] {
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

  const swapAndBridge: EvmCall = {
    from: params.from,
    to: params.emitter as `0x${string}`,
    data: swapData,
    type: CallType.Evm,
    dryRun: async () => undefined,
  };

  if (params.approved) {
    return [swapAndBridge];
  }

  const approveData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [params.emitter as `0x${string}`, params.amountIn],
  });

  const approve: EvmCall = {
    from: params.from,
    to: params.assetInAddress,
    data: approveData,
    type: CallType.Evm,
    allowance: params.amountIn,
    dryRun: async () => undefined,
  };

  return [approve, swapAndBridge];
}
