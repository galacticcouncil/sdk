import {
  getSs58AddressInfo,
  fromBufferToBase58,
} from '@polkadot-api/substrate-bindings';
import { toHex, fromHex } from '@polkadot-api/utils';

import { PublicKey as SolanaPublicKey } from '@solana/web3.js';
import { isAddress as isEvmAddress } from 'viem';
import { hex } from '@galacticcouncil/common';

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
    if (!addr || hex.isHex(addr) || !RE_SS58_BASE58_32.test(addr)) return false;
    const info = getSs58AddressInfo(addr);
    return info.isValid && info.publicKey.length === 32;
  }

  static isValid(address: string): boolean {
    return this.isSs58Strict(address);
  }

  static getPubKey(address: string): string {
    if (!this.isSs58Strict(address)) throw new Error('Invalid SS58 address');
    const info = getSs58AddressInfo(address);
    if (!info.isValid) throw new Error('Invalid SS58 address');
    return toHex(info.publicKey);
  }

  static encodePubKey(pubKey: string, ss58Prefix = 0): string {
    const normalized = hex.hexNormalize(pubKey);
    hex.assertHexLen(normalized, 32);
    const publicKeyBytes = fromHex(hex.stripHexPrefix(normalized));
    return fromBufferToBase58(ss58Prefix)(publicKeyBytes);
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
    return toHex(new SolanaPublicKey(address).toBytes()); // 32 bytes
  }

  static encodePubKey(pubKey: string): string {
    const normalized = hex.hexNormalize(pubKey);
    hex.assertHexLen(normalized, 32);
    const bytes = fromHex(hex.stripHexPrefix(normalized));
    return new SolanaPublicKey(bytes).toBase58();
  }
}

// -------------------- Sui --------------------

export class SuiAddr {
  static isValid(address: string): boolean {
    return RE_SUI_ADDR.test(address);
  }
}
