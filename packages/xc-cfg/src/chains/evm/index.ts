import { AnyChain } from '@galacticcouncil/xc-core';

import { base } from './base';
import { ethereum } from './mainnet';

export const evmChains: AnyChain[] = [base, ethereum];

export { base, ethereum };
