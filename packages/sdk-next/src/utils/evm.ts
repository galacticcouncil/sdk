import { AccountId } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { Buffer } from 'buffer';

import { HYDRATION_SS58_PREFIX } from '../consts';

const ETH_PREFIX = 'ETH\0';

export function convertFromH160(
  h160addr: string,
  ss58prefix = HYDRATION_SS58_PREFIX
): string {
  const addressBytes = Buffer.from(h160addr.slice(2), 'hex');
  const prefixBytes = Buffer.from(ETH_PREFIX);
  const convertBytes = Uint8Array.from(
    Buffer.concat([prefixBytes, addressBytes, Buffer.alloc(8)])
  );
  const addressHex = toHex(convertBytes);
  return AccountId(ss58prefix).dec(addressHex);
}

export function convertToH160(ss58addr: string): string {
  const decodedBytes = AccountId().enc(ss58addr);
  const prefixBytes = Buffer.from(ETH_PREFIX);
  const addressBytes = decodedBytes.slice(prefixBytes.length, -8);
  return '0x' + Buffer.from(addressBytes).toString('hex');
}

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
