import { encodeAbiParameters, size, type Hex } from 'viem';

import { MAX_FORWARD_DATA } from '../consts';

/**
 * ICE forward calldata the dispatcher's `execute` decodes an order from.
 *
 * - `abi.encode(depositAddress, maxRelayFee, terms)`
 * - Fits ICE's limit while destination + recipient stay within 265 bytes
 *
 * @param depositAddress - 1Click deposit address on Ethereum, crediting `A`
 * @param maxRelayFee - relay ceiling, wei
 * @param terms - packed terms
 * @throws when over ICE's limit
 */
export function forwardData(
  depositAddress: Hex,
  maxRelayFee: bigint,
  terms: Hex
): Hex {
  const data = encodeAbiParameters(
    [{ type: 'address' }, { type: 'uint256' }, { type: 'bytes' }],
    [depositAddress, maxRelayFee, terms]
  );
  const len = size(data);
  if (len > MAX_FORWARD_DATA) {
    throw new Error(
      `Forward data is ${len} bytes, ICE allows ${MAX_FORWARD_DATA}`
    );
  }
  return data;
}
