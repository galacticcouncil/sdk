import { hexToU8a, isHex } from '@polkadot/util';
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

export function validateSolana(solanaAddr: string) {
  const re = /^[1-9A-HJ-NP-Za-km-z1-9]{32,44}$/;
  if (!re.test(solanaAddr)) {
    throw 'Invalid solana address provided!';
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

export function isSolana(address: string) {
  try {
    validateSolana(address);
    return true;
  } catch {
    return false;
  }
}
