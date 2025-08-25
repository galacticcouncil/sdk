import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';

import { PoolBase } from './types';

export function hashPools(pools: PoolBase[]): string {
  const ids = pools
    .map((p) => p.address)
    .sort()
    .join(':');
  const encoded = new TextEncoder().encode(ids);
  const digest = sha256(encoded);
  return bytesToHex(digest);
}
