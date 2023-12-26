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
  if (ss58Addr.length !== 48 || ss58Addr.at(0) !== '5') {
    throw 'Invalid SS58 address provided!';
  }
}

export function validatePubKey(pubkey: string) {
  const re = /0x[0-9a-fA-F]{64}/;
  if (!re.test(pubkey)) {
    throw 'Invalid Public Key provided!';
  }
}

export function isSs58Address(address: string) {
  try {
    validateSs58(address);
    return true;
  } catch {
    return false;
  }
}

export function isH160Address(address: string) {
  try {
    validateH160(address);
    return true;
  } catch {
    return false;
  }
}
