import { ChainConfig } from '@galacticcouncil/xcm-config';

import { hydraDxConfig } from './hydraDX';
import { moonbeamConfig } from './moonbeam';
import { acalaConfig } from './acala';
import { polkadotConfig } from './polkadot';

export const chainsConfig: ChainConfig[] = [hydraDxConfig, moonbeamConfig, acalaConfig, polkadotConfig];
