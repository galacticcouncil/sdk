import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { isHex, hexToU8a, u8aToHex } from '@polkadot/util';

import { PublicKey as SolanaPublicKey } from '@solana/web3.js';
import { isAddress as isEvmAddress } from 'viem';

export interface Addr {
  isValid(address: string): boolean;
  /** Returns hex public key (0x...) */
  getPubKey(address: string): string;
  /** Encodes a hex public key (0x...) into an address string. */
  encodePubKey(pubKey: string): string;
}

// -------------------- Utils --------------------

const RE_SUI_ADDR = /^0x[0-9a-fA-F]{64}$/;
const RE_SS58_BASE58_32 = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/;

function hexNormalize(h: string): string {
  let s = h.toLowerCase();
  if (!s.startsWith('0x')) s = '0x' + s;
  return s;
}

function assertHexLen(h: string, bytes: number) {
  if (!/^0x[0-9a-fA-F]+$/.test(h) || h.length - 2 !== bytes * 2) {
    throw new Error(`Expected 0x hex of ${bytes} bytes`);
  }
}

// -------------------- Substrate (SS58) --------------------

export class Ss58Addr {
  /**
   * Strict SS58 only to avoid confusing 0x32 (Sui/EVM-like) with SS58.
   * Accept any prefix as long as it decodes to 32 bytes.
   *
   * @param addr - address
   * @returns true if strict ss58, otherwise false
   */
  private static isSs58Strict(addr: string): boolean {
    if (!addr || isHex(addr) || !RE_SS58_BASE58_32.test(addr)) return false;
    try {
      const pk = decodeAddress(addr);
      return pk.length === 32;
    } catch {
      return false;
    }
  }

  static isValid(address: string): boolean {
    return this.isSs58Strict(address);
  }

  static getPubKey(address: string): string {
    if (!this.isSs58Strict(address)) throw new Error('Invalid SS58 address');
    return u8aToHex(decodeAddress(address));
  }

  static encodePubKey(pubKey: string, ss58Prefix = 0): string {
    const hex = hexNormalize(pubKey);
    assertHexLen(hex, 32);
    return encodeAddress(hexToU8a(hex), ss58Prefix);
  }
}

// -------------------- Evm (H160) --------------------

export class EvmAddr {
  static isValid(address: string): boolean {
    return isEvmAddress(address, { strict: false });
  }
}

// -------------------- Solana --------------------

export class SolanaAddr {
  static isValid(address: string): boolean {
    try {
      const pk = new SolanaPublicKey(address);
      return pk.toBase58() === address && pk.toBytes().length === 32;
    } catch {
      return false;
    }
  }

  static getPubKey(address: string): string {
    if (!this.isValid(address)) throw new Error('Invalid Solana address');
    return u8aToHex(new SolanaPublicKey(address).toBytes()); // 32 bytes
  }

  static encodePubKey(pubKey: string): string {
    const hex = hexNormalize(pubKey);
    assertHexLen(hex, 32);
    return new SolanaPublicKey(hexToU8a(hex)).toBase58();
  }
}

// -------------------- Sui --------------------

export class SuiAddr {
  static isValid(address: string): boolean {
    return RE_SUI_ADDR.test(address);
  }
}
