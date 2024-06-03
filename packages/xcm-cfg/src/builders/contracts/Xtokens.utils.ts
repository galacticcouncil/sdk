import { Parachain, addr } from '@galacticcouncil/xcm-core';

import { u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

type DestinationMultilocation = [
  /**
   * 1 - if transaction is going through a relay chain
   */
  1,
  (
    | [
        /**
         * example '0x00000007DC'
         * 7DC - parachain id in hex
         * can be found here:
         *   - https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fkusama-rpc.polkadot.io#/parachains
         *   - https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io#/parachains
         */
        string,
        /**
         * example '0x01%account%00',
         * enum = 01 (AccountId32)
         * networkId = 00 (any)
         */
        string,
      ]
    | [
        /**
         * example '0x01%account%00',
         * enum = 01 (AccountId32)
         * networkId = 00 (any)
         */
        string,
      ]
  ),
];

/**
 * Build destination multilocation
 *
 * 01: AccountId32
 * 03: AccountKey20
 *
 * @see https://docs.moonbeam.network/builders/interoperability/xcm/xc20/xtokens/#building-the-precompile-multilocation
 *
 * @param address - destination address
 * @param destination - destination chain
 * @returns multilocation
 */
export function getDestinationMultilocation(
  address: string,
  destination: Parachain
): DestinationMultilocation {
  const accountType = addr.isH160(address) ? '03' : '01';
  const acc = `0x${accountType}${u8aToHex(
    decodeAddress(address),
    -1,
    false
  )}00`;

  return [
    1,
    destination.parachainId
      ? [`0x0000000${destination.parachainId.toString(16)}`, acc]
      : [acc],
  ];
}
