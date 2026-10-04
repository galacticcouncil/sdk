import { AnyChain } from '@galacticcouncil/xc-core';

import { near_chain } from './mainnet';
import { near_testnet } from './testnet';

export const nearChains: AnyChain[] = [near_chain, near_testnet];

export { near_chain, near_testnet };
