import { AnyChain } from '@galacticcouncil/xc-core';

import { base } from './base';
import { ethereum } from './mainnet';
import { robinhood } from './robinhood';

export const evmChains: AnyChain[] = [base, ethereum, robinhood];

export { base, ethereum, robinhood };
