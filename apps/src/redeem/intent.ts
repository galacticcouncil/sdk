import { EvmCall } from '@galacticcouncil/xc-sdk';

import { encodeFunctionData } from 'viem';

/**
 * IntentReceiver on Ethereum (NIR — Near Intent Routing, leg 2).
 *
 * `redeem(vaa, feeRequested)` runs atomically: completeTransferWithPayload,
 * unwrap WETH → native ETH, pay the caller `feeRequested`, then forward the
 * rest to the 1Click deposit address baked into the payload.
 *
 * See whm/contracts/scripts/nirRelay.ts.
 */
export const INTENT_RECEIVER: `0x${string}` =
  '0xf1a5fe4252d9a1c39b0fb9de1f19049ee57ed188';

const INTENT_RECEIVER_ABI = [
  {
    name: 'redeem',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'vaa', type: 'bytes' },
      { name: 'feeRequested', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

/** Decode a base64 VAA (as issued by the Wormhole guardians) to 0x-prefixed hex. */
function toVaaHex(vaa: string): `0x${string}` {
  const bytes = Uint8Array.from(atob(vaa), (c) => c.charCodeAt(0));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(
    ''
  );
  return `0x${hex}`;
}

/**
 * Build the Ethereum intent redeem — `IntentReceiver.redeem(vaa, feeRequested)`.
 *
 * `feeRequested` defaults to 0: forward 100% to the deposit address, the caller
 * (the connected wallet, self-relaying) eats the gas. 0 is always ≤ the payload's
 * maxRelayFee ceiling, so redeem never reverts FeeExceedsCeiling.
 */
export function redeemIntent(
  from: string,
  vaa: string,
  feeRequested: bigint = 0n
): EvmCall {
  const data = encodeFunctionData({
    abi: INTENT_RECEIVER_ABI,
    functionName: 'redeem',
    args: [toVaaHex(vaa), feeRequested],
  });

  return {
    abi: JSON.stringify(INTENT_RECEIVER_ABI),
    data,
    from,
    to: INTENT_RECEIVER,
  } as EvmCall;
}
