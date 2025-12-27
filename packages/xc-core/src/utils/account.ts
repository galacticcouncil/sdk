import {
  AccountId,
  Blake2256,
  compactNumber,
  getSs58AddressInfo,
  u32,
} from '@polkadot-api/substrate-bindings';
import { toHex, fromHex } from '@polkadot-api/utils';

/**
 * Multilocation-derivative account - an account computed when
 * executing remote calls via XCM.
 *
 * @param parachainId parachain id or undefined in case of relay
 * @param address sender address
 * @param parents describe family
 * @returns multilocation derivated account address
 */
export function getMultilocationDerivatedAccount(
  parachainId: number | undefined,
  address: string,
  parents: number,
  isEthereumStyle = false
) {
  // Check ethereum address
  const ethAddress = address.length === 42;
  const accType = ethAddress ? 'AccountKey20' : 'AccountId32';

  // Decode address if needed
  let decodedAddress: Uint8Array;
  if (ethAddress) {
    decodedAddress = fromHex(address.slice(2));
  } else {
    const info = getSs58AddressInfo(address);
    if (!info.isValid) throw new Error('Invalid SS58 address');
    decodedAddress = info.publicKey;
  }

  // Describe family
  let family = 'SiblingChain';
  if (parents == 0 && parachainId) family = 'ChildChain';
  else if (parents == 1 && !parachainId) family = 'ParentChain';

  // Calculate hash component
  const compactEncoder = compactNumber.enc;
  let toHash = new Uint8Array([
    ...new TextEncoder().encode(family),
    ...(parachainId ? compactEncoder(parachainId) : []),
    ...compactEncoder(accType.length + (ethAddress ? 20 : 32)),
    ...new TextEncoder().encode(accType),
    ...decodedAddress,
  ]);

  const hash = Blake2256(toHash);
  if (isEthereumStyle) {
    return toHex(hash.slice(0, 20));
  }
  return AccountId().dec(hash);
}

/**
 * Sovereign account — an account each chain in the ecosystem has, one for the relay chain
 * and the other for other parachains. The account is owned by root and can only be used
 * through SUDO (if available) or democracy (technical committee or referenda).
 *
 * @param parachainId parachain id
 * @returns sovereign account addresses
 */
export function getSovereignAccounts(parachainId: number) {
  const paraIdU8a = u32.enc(parachainId);

  const paraBytes = new TextEncoder().encode('para');
  const siblBytes = new TextEncoder().encode('sibl');

  const relay = toHex(new Uint8Array([...paraBytes, ...paraIdU8a])).padEnd(
    66,
    '0'
  );

  const generic = toHex(new Uint8Array([...siblBytes, ...paraIdU8a])).padEnd(
    66,
    '0'
  );

  const moonbeam = generic.slice(0, 42);

  return {
    generic,
    moonbeam,
    relay,
  };
}
