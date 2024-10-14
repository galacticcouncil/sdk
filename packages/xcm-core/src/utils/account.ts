import {
  bnToU8a,
  hexToU8a,
  stringToU8a,
  u8aToHex,
  u8aToString,
} from '@polkadot/util';

import { decodeAddress, blake2AsU8a } from '@polkadot/util-crypto';
import { TypeRegistry } from '@polkadot/types';

/**
 * Multilocation-derivative account - an account computed when executing remote calls
 * via XCM.
 *
 * @param parachainId parachain id
 * @param address sender address
 * @param parents describe family
 * @returns multilocation derivated account address
 */
export function getMultilocationDerivatedAccount(
  parachainId: number,
  address: string,
  parents: number
) {
  // Check Ethereum Address and/or Decode
  const ethAddress = address.length === 42;
  const accType = ethAddress ? 'AccountKey20' : 'AccountId32';

  // Decode Address if Needed
  let decodedAddress: Uint8Array;
  if (!ethAddress) {
    decodedAddress = decodeAddress(address);
  } else {
    decodedAddress = hexToU8a(address);
  }

  // Describe Family
  let family = 'SiblingChain';
  if (parents == 0 && parachainId) family = 'ChildChain';
  else if (parents == 1 && !parachainId) family = 'ParentChain';

  // Calculate Hash Component
  const registry = new TypeRegistry();
  let toHash = new Uint8Array([
    ...new TextEncoder().encode(family),
    ...(parachainId
      ? registry.createType('Compact<u32>', parachainId).toU8a()
      : []),
    ...registry
      .createType('Compact<u32>', accType.length + (ethAddress ? 20 : 32))
      .toU8a(),
    ...new TextEncoder().encode(accType),
    ...decodedAddress,
  ]);

  return u8aToHex(blake2AsU8a(toHash).slice(0, 20));
}

/**
 * Sovereign account — an account each chain in the ecosystem has, one for the relay chain
 * and the other for other parachains. The account is owned by root and can only be used
 * through SUDO (if available) or democracy (technical committee or referenda). The sovereign
 * account typically signs XCM messages in other chains in the ecosystem.
 *
 * @param parachainId parachain id
 * @returns sovereign account addresses
 */
export function getSovereignAccounts(parachainId: number) {
  const paraIdU8a = bnToU8a(parachainId, { bitLength: 32 });
  const relay = u8aToHex(
    new Uint8Array([...stringToU8a('para'), ...paraIdU8a])
  ).padEnd(66, '0');
  const generic = u8aToHex(
    new Uint8Array([...stringToU8a('sibl'), ...paraIdU8a])
  ).padEnd(66, '0');
  const moonbeam = generic.slice(0, 42);

  return {
    generic,
    moonbeam,
    relay,
  };
}
