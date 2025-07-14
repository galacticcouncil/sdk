import { AnyChain } from '@galacticcouncil/xcm-core';

import { bsc } from './bsc';
import { ethereum } from './mainnet';

export const evmChains: AnyChain[] = [bsc, ethereum];

export { bsc, ethereum };
