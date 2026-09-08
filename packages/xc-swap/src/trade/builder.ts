import { CallType } from '@galacticcouncil/xc-core';
import type { EvmCall } from '@galacticcouncil/xc-sdk';

import { encodeFunctionData, erc20Abi } from 'viem';

import { PLACE_ORDER_ABI } from './abi';
import type { BuildCallsParams } from './types';

/**
 * Build the executable EVM calls on Hydration EVM:
 *   1. `approve(emitter, amountIn)` on A's ERC-20 precompile — skipped when
 *      `approved` (the emitter already has sufficient allowance).
 *   2. `placeOrder(...)` on the `IntentEmitter`.
 */
export function buildCalls(params: BuildCallsParams): EvmCall[] {
  const orderData = encodeFunctionData({
    abi: PLACE_ORDER_ABI,
    functionName: 'placeOrder',
    args: [
      params.assetIn,
      params.amountIn,
      params.minEthOut,
      params.depositAddress as `0x${string}`,
      params.maxRelayFee,
    ],
  });

  const placeOrder: EvmCall = {
    from: params.from,
    to: params.emitter as `0x${string}`,
    data: orderData,
    abi: JSON.stringify(PLACE_ORDER_ABI),
    type: CallType.Evm,
    dryRun: async () => undefined,
  };

  if (params.approved) {
    return [placeOrder];
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
    abi: JSON.stringify(erc20Abi),
    type: CallType.Evm,
    allowance: params.amountIn,
    dryRun: async () => undefined,
  };

  return [approve, placeOrder];
}
