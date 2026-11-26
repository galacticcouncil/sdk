import { CallType } from '@galacticcouncil/xc-core';
import type { EvmCall } from '@galacticcouncil/xc-sdk';

import { encodeFunctionData } from 'viem';

import { WETH_ERC20 } from '../consts';

import { DISPATCHER_ABI, ERC20_ABI } from '../dispatcher';
import type { BuildCloseParams, BuildDispatchParams } from './types';

/**
 * Builds the direct WETH order on Hydration EVM.
 *
 * - `approve(dispatcher, amount)` on the WETH precompile, skipped when `approved`
 * - `dispatch(amount, 0xN, C, terms)` on the dispatcher
 *
 * @param params - owner, amount and the prepared order
 */
export function buildDispatchCalls(params: BuildDispatchParams): EvmCall[] {
  const dispatch: EvmCall = {
    from: params.from,
    to: params.dispatcher,
    data: encodeFunctionData({
      abi: DISPATCHER_ABI,
      functionName: 'dispatch',
      args: [
        params.amount,
        params.depositAddress,
        params.maxRelayFee,
        params.terms,
      ],
    }),
    abi: JSON.stringify(DISPATCHER_ABI),
    type: CallType.Evm,
    dryRun: async () => undefined,
  };

  if (params.approved) {
    return [dispatch];
  }

  const approve: EvmCall = {
    from: params.from,
    to: WETH_ERC20,
    data: encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [params.dispatcher, params.amount],
    }),
    abi: JSON.stringify(ERC20_ABI),
    type: CallType.Evm,
    allowance: params.amount,
    dryRun: async () => undefined,
  };

  return [approve, dispatch];
}

/**
 * Builds the close of a set of terms on Hydration EVM.
 *
 * - `close(terms, delay)` on the dispatcher, paying the Wormhole message fee
 * - Does not remove the ICE intent: that is a runtime call, batched by the caller
 *
 * @param params - owner, terms and countdown
 */
export function buildCloseCalls(params: BuildCloseParams): EvmCall[] {
  return [
    {
      from: params.from,
      to: params.dispatcher,
      data: encodeFunctionData({
        abi: DISPATCHER_ABI,
        functionName: 'close',
        args: [params.terms, BigInt(params.delay)],
      }),
      abi: JSON.stringify(DISPATCHER_ABI),
      type: CallType.Evm,
      value: params.messageFee,
      dryRun: async () => undefined,
    },
  ];
}
