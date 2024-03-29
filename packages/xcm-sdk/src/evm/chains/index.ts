import { Chain } from 'viem';

import { acala } from './acala';
import { hydradx } from './hydradx';
import { moonbeam } from './moonbeam';

export const evmChains: Record<string, Chain> = {
  acala: acala,
  hydradx: hydradx,
  moonbeam: moonbeam,
};
