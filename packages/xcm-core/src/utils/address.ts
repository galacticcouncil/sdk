import { isHex, hexToU8a } from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { Buffer } from 'buffer';

export function getPubKey(ss58addr: string) {
  return '0x' + Buffer.from(decodeAddress(ss58addr)).toString('hex');
}

export function encodePubKey(pubKey: string, prefix: number) {
  validatePubKey(pubKey);
  return encodeAddress(pubKey, prefix);
}

export function validateH160(h160Addr: string) {
  const re = /0x[0-9A-Fa-f]{40}/g;
  if (!re.test(h160Addr)) {
    throw 'Invalid H160 address provided!';
  }
}

export function validateSs58(ss58Addr: string) {
  try {
    const bytes = isHex(ss58Addr)
      ? hexToU8a(ss58Addr)
      : decodeAddress(ss58Addr);
    encodeAddress(bytes);
  } catch (error) {
    throw 'Invalid SS58 address provided!';
  }
}

export function validatePubKey(pubkey: string) {
  const re = /0x[0-9a-fA-F]{64}/;
  if (!re.test(pubkey)) {
    throw 'Invalid Public Key provided!';
  }
}

export function isSs58(address: string) {
  try {
    validateSs58(address);
    return true;
  } catch {
    return false;
  }
}

export function isH160(address: string) {
  try {
    validateH160(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format address in 32 bytes (left padded)
 *
 * @param address 20 bytes 0x address
 * @returns 32 bytes 0x address
 */
export function toHex(address: string) {
  return '0x000000000000000000000000' + address.substring(2);
}

/**
 * Format address in 20 bytes
 *
 * @param address 32 bytes lef padded 0x address
 * @returns 20 bytes 0x address
 */
export function toNative(address: string) {
  return '0x' + address.substring(26);
}
