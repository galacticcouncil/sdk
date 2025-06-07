import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { hexToU8a, isHex, u8aToHex } from '@polkadot/util';

import { Buffer } from 'buffer';

import { HYDRADX_SS58_PREFIX } from '../consts';

const ETH_PREFIX = 'ETH\0';

export function isEvmAccount(address: string): boolean {
  if (!address) return false;

  try {
    const pub = decodeAddress(address, true);
    const prefixBytes = Buffer.from(ETH_PREFIX);
    return Buffer.from(pub.subarray(0, prefixBytes.length)).equals(prefixBytes);
  } catch {
    return false;
  }
}

export function isEvmAddress(address: string): boolean {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return false;
  }
  return true;
}

export function isSs58Address(address: string): boolean {
  try {
    const bytes = isHex(address) ? hexToU8a(address) : decodeAddress(address);
    encodeAddress(bytes);
    return true;
  } catch (error) {
    return false;
  }
}

export class H160 {
  static toAccount = (address: string) => {
    const addressBytes = Buffer.from(address.slice(2), 'hex');
    const prefixBytes = Buffer.from(ETH_PREFIX);
    return encodeAddress(
      new Uint8Array(
        Buffer.concat([prefixBytes, addressBytes, Buffer.alloc(8)])
      ),
      HYDRADX_SS58_PREFIX
    );
  };

  static fromAccount = (address: string) => {
    const decodedBytes = decodeAddress(address);
    const prefixBytes = Buffer.from(ETH_PREFIX);
    const addressBytes = decodedBytes.slice(prefixBytes.length, -8);
    return '0x' + Buffer.from(addressBytes).toString('hex');
  };

  static fromSS58 = (address: string) => {
    const decodedBytes = decodeAddress(address);
    const slicedBytes = decodedBytes.slice(0, 20);
    return u8aToHex(slicedBytes);
  };

  static fromAny = (address: string) => {
    if (isEvmAddress(address)) {
      return address;
    }

    if (isEvmAccount(address)) {
      return H160.fromAccount(address);
    }

    if (isSs58Address(address)) {
      return H160.fromSS58(address);
    }

    throw new Error('Unknown address type');
  };
}
