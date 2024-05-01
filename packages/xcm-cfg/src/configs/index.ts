import { ChainConfig } from '@galacticcouncil/xcm-core';

import { kusamaChainsConfig } from './kusama';
import { polkadotChainsConfig } from './polkadot';

import { ethereumConfig } from './ethereum';

export const chainsConfig: ChainConfig[] = [
  ...kusamaChainsConfig,
  ...polkadotChainsConfig,
  ethereumConfig,
];

export const chainsConfigMap = new Map<string, ChainConfig>(
  chainsConfig.map((config) => [config.chain.key, config])
);
