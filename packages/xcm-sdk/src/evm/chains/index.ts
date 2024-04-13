import { Chain } from 'viem';
import { mainnet } from 'viem/chains';

import { acala } from './acala';
import { hydradx } from './hydradx';
import { moonbeam } from './moonbeam';

export const evmChains: Record<string, Chain> = {
  acala: acala,
  acalaMrl: acala,
  hydradx: hydradx,
  moonbeam: moonbeam,
  ethereum: mainnet,
};
