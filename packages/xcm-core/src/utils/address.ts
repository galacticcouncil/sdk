import { hexToU8a, isHex } from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { Buffer } from 'buffer';
import bs58 from 'bs58';

const RE_H160 = /^0x[0-9a-fA-F]{40}$/;
const RE_HEX32 = /^0x[0-9a-fA-F]{64}$/;
const RE_BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const RE_SUI_HEX_32 = /^(?:0x)?[0-9a-fA-F]{64}$/;

function strip0x(s: string): string {
  return s.startsWith('0x') || s.startsWith('0X') ? s.slice(2) : s;
}

export function getPubKey(ss58addr: string) {
  return '0x' + Buffer.from(decodeAddress(ss58addr)).toString('hex');
}

export function encodePubKey(pubKey: string, prefix: number) {
  validatePubKey(pubKey);
  return encodeAddress(pubKey, prefix);
}

export function validateH160(h160Addr: string) {
  if (!RE_H160.test(h160Addr)) {
    throw 'Invalid H160 address';
  }
}

export function validateSs58(ss58Addr: string) {
  try {
    const bytes = isHex(ss58Addr)
      ? hexToU8a(ss58Addr)
      : decodeAddress(ss58Addr);
    encodeAddress(bytes);
  } catch (error) {
    throw 'Invalid SS58 address';
  }
}

export function validateSolana(solanaAddr: string) {
  if (!RE_BASE58.test(solanaAddr)) {
    throw new Error('Invalid Solana address');
  }

  try {
    bs58.decode(solanaAddr);
  } catch {
    throw new Error('Invalid Solana address');
  }
}

export function validateSui(suiAddr: string): void {
  if (!RE_SUI_HEX_32.test(suiAddr)) {
    throw new Error('Invalid Sui address: must be hex with optional 0x prefix');
  }

  const hex = strip0x(suiAddr);
  if (hex.length === 0) {
    throw new Error('Invalid Sui address: missing hex digits');
  }

  if (hex.length > 64) {
    throw new Error('Invalid Sui address: exceeds 32 bytes (64 hex chars)');
  }
}

export function validatePubKey(pubkey: string) {
  if (!RE_HEX32.test(pubkey)) {
    throw 'Invalid Public Key';
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

export function isSui(address: string) {
  try {
    validateSui(address);
    return true;
  } catch {
    return false;
  }
}
