import { AnyChain } from '@galacticcouncil/xc-core';

import { arbitrum } from './arbitrum';
import { base } from './base';
import { ethereum } from './mainnet';
import { optimism } from './optimism';

export const evmChains: AnyChain[] = [arbitrum, base, ethereum, optimism];

export { arbitrum, base, ethereum, optimism };
