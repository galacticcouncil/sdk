import { Parachain } from '@galacticcouncil/xcm-core';

import { u8aToHex, hexToU8a } from '@polkadot/util';
import { decodeAddress, blake2AsU8a } from '@polkadot/util-crypto';
import { TypeRegistry } from '@polkadot/types';

export function calculateMDA(address: string, paraId: string, parents: number) {
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

  let family = 'SiblingChain';
  if (parents == 0 && paraId) family = 'ChildChain';
  else if (parents == 1 && !paraId) family = 'ParentChain';

  // Calculate Hash Component
  const registry = new TypeRegistry();
  let toHash = new Uint8Array([
    ...new TextEncoder().encode(family),
    ...(paraId ? registry.createType('Compact<u32>', paraId).toU8a() : []),
    ...registry
      .createType('Compact<u32>', accType.length + (ethAddress ? 20 : 32))
      .toU8a(),
    ...new TextEncoder().encode(accType),
    ...decodedAddress,
  ]);

  return u8aToHex(blake2AsU8a(toHash).slice(0, 20));
}

export function getDerivatedAccount(
  parachain: Parachain,
  address: string,
  parents: number
) {
  // Check Ethereum Address and/or Decode
  const ethAddress = address.length === 42;
  const accType = ethAddress ? 'AccountKey20' : 'AccountId32';
  const paraId = parachain.parachainId;

  // Decode Address if Needed
  let decodedAddress: Uint8Array;
  if (!ethAddress) {
    decodedAddress = decodeAddress(address);
  } else {
    decodedAddress = hexToU8a(address);
  }

  let family = 'SiblingChain';
  if (parents == 0 && paraId) family = 'ChildChain';
  else if (parents == 1 && !paraId) family = 'ParentChain';

  // Calculate Hash Component
  const registry = new TypeRegistry();
  let toHash = new Uint8Array([
    ...new TextEncoder().encode(family),
    ...(paraId ? registry.createType('Compact<u32>', paraId).toU8a() : []),
    ...registry
      .createType('Compact<u32>', accType.length + (ethAddress ? 20 : 32))
      .toU8a(),
    ...new TextEncoder().encode(accType),
    ...decodedAddress,
  ]);

  return u8aToHex(blake2AsU8a(toHash).slice(0, 20));
}
