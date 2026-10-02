import { AnyChain } from '@galacticcouncil/xc-core';

import { base } from './base';
import { hyperevm } from './hyperevm';
import { ethereum } from './mainnet';
import { robinhood } from './robinhood';

export const evmChains: AnyChain[] = [base, ethereum, hyperevm, robinhood];

export { base, ethereum, hyperevm, robinhood };
