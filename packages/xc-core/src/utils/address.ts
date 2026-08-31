import {
  getSs58AddressInfo,
  fromBufferToBase58,
} from '@polkadot-api/substrate-bindings';
import { toHex, fromHex } from '@polkadot-api/utils';

import { PublicKey as SolanaPublicKey } from '@solana/web3.js';
import { isAddress as isEvmAddress } from 'viem';
import { hex } from '@galacticcouncil/common';

import { base58 } from '@scure/base';
import { sha256 } from '@noble/hashes/sha2';

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

/**
 * NEAR account id — lowercase, dot-separated labels.
 *
 * - A label is alphanumeric, optionally joined by a single `-` or `_`
 * - Rejects leading, trailing and doubled separators
 */
const RE_NEAR_ACCOUNT = /^(([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+$/;

/** NEAR implicit account — the hex of an ed25519 public key. */
const RE_NEAR_IMPLICIT = /^[0-9a-f]{64}$/;

/** Base58 alphabet — checked before decoding so a bad character never throws. */
const RE_BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

const NEAR_ACCOUNT_MIN = 2;
const NEAR_ACCOUNT_MAX = 64;

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

// -------------------- Near --------------------

export class NearAddr {
  /**
   * Whether the string is a well-formed NEAR account id.
   *
   * - Covers both named accounts and 64-hex implicit ones
   * - Syntax only; says nothing about the account existing
   *
   * @param address - account id to check
   */
  static isValid(address: string): boolean {
    if (
      !address ||
      address.length < NEAR_ACCOUNT_MIN ||
      address.length > NEAR_ACCOUNT_MAX
    ) {
      return false;
    }
    return RE_NEAR_ACCOUNT.test(address);
  }

  /**
   * Whether the account id is implicit — the hex of an ed25519 public key.
   *
   * - Implicit accounts need no registration, the id is the key
   *
   * @param address - account id to check
   */
  static isImplicit(address: string): boolean {
    return RE_NEAR_IMPLICIT.test(address);
  }
}

// -------------------- Zcash --------------------

/** Transparent address version bytes: P2PKH (`t1`) and P2SH (`t3`). */
const ZEC_VERSION_P2PKH = 0x1cb8;
const ZEC_VERSION_P2SH = 0x1cbd;

/** 2 version bytes + a 20-byte hash + a 4-byte checksum. */
const ZEC_ADDR_BYTES = 26;
const ZEC_CHECKSUM_BYTES = 4;

export class ZecAddr {
  /**
   * Whether the string is a valid transparent Zcash address.
   *
   * - Only `t1` and `t3` — the forms NEAR Intents can withdraw to
   * - Shielded and unified addresses are rejected, not merely unsupported
   * - Verifies the base58check checksum, so a typo fails rather than passes
   *
   * @param address - address to check
   */
  static isValid(address: string): boolean {
    if (!RE_BASE58.test(address)) return false;

    // Reached only for alphabet-valid input, so a throw here is not a typo.
    const decoded = base58.decode(address);

    if (decoded.length !== ZEC_ADDR_BYTES) return false;

    const version = (decoded[0] << 8) | decoded[1];
    if (version !== ZEC_VERSION_P2PKH && version !== ZEC_VERSION_P2SH) {
      return false;
    }

    const body = decoded.subarray(0, ZEC_ADDR_BYTES - ZEC_CHECKSUM_BYTES);
    const checksum = decoded.subarray(ZEC_ADDR_BYTES - ZEC_CHECKSUM_BYTES);
    const hash = sha256(sha256(body));

    return checksum.every((byte, i) => byte === hash[i]);
  }
}
