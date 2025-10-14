import { AccountId } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { HYDRATION_SS58_PREFIX } from '../consts';

export function getAccountAddress(seed: string) {
  const name = ('modl' + seed).padEnd(32, '\0');
  const nameU8a = new TextEncoder().encode(name);
  const nameHex = toHex(nameU8a);
  return AccountId(HYDRATION_SS58_PREFIX).dec(nameHex);
}
