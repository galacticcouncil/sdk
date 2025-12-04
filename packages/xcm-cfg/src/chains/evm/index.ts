import { AnyChain } from '@galacticcouncil/xcm-core';

import { ethereum } from './mainnet';
import { base } from './base';

export const evmChains: AnyChain[] = [ethereum, base];

export { ethereum, base };
