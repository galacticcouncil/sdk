import { Parachain, addr } from '@galacticcouncil/xcm-core';

import { getSs58AddressInfo } from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';

const { EvmAddr } = addr;

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
  const accountType = EvmAddr.isValid(address) ? '03' : '01';

  const info = getSs58AddressInfo(address);
  if (!info.isValid) {
    throw new Error(`Invalid SS58 address: ${address}`);
  }

  const acc = `0x${accountType}${toHex(info.publicKey).slice(2)}00`;

  return [
    1,
    destination.parachainId
      ? [`0x0000000${destination.parachainId.toString(16)}`, acc]
      : [acc],
  ];
}

export function formatAssetIdToERC20(id: string) {
  if (id.startsWith('0x')) {
    return id;
  }

  if (!/^\d{38,39}$/.test(id)) {
    throw new Error(`Asset id: ${id} must be a string and have 38-39 digits`);
  }

  return `0xffffffff${BigInt(id).toString(16).padStart(32, '0')}`;
}
