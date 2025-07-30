import { AccountId } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { Buffer } from 'buffer';

import { HYDRATION_SS58_PREFIX } from '../consts';

const ETH_PREFIX = 'ETH\0';

export function isEvmAccount(ss58addr: string) {
  if (!ss58addr) return false;

  try {
    const addressBytes = AccountId().enc(ss58addr);
    const prefixBytes = Buffer.from(ETH_PREFIX);
    return Buffer.from(addressBytes.subarray(0, prefixBytes.length)).equals(
      prefixBytes
    );
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
    AccountId(HYDRATION_SS58_PREFIX).enc(address);
    return true;
  } catch (error) {
    return false;
  }
}

export class H160 {
  static toAccount = (address: string) => {
    const addressBytes = Buffer.from(address.slice(2), 'hex');
    const prefixBytes = Buffer.from(ETH_PREFIX);
    const convertBytes = Uint8Array.from(
      Buffer.concat([prefixBytes, addressBytes, Buffer.alloc(8)])
    );
    const addressHex = toHex(convertBytes);
    return AccountId(HYDRATION_SS58_PREFIX).dec(addressHex);
  };

  static fromAccount = (address: string) => {
    const decodedBytes = AccountId().enc(address);
    const prefixBytes = Buffer.from(ETH_PREFIX);
    const addressBytes = decodedBytes.slice(prefixBytes.length, -8);
    return '0x' + Buffer.from(addressBytes).toString('hex');
  };

  static fromSS58 = (address: string) => {
    const decodedBytes = AccountId().enc(address);
    const slicedBytes = decodedBytes.slice(0, 20);
    return toHex(slicedBytes);
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
