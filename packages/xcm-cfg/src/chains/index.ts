import { AnyChain } from '@galacticcouncil/xcm-core';

import { evmChains } from './evm';
import { polkadotChains } from './polkadot';
import { kusamaChains } from './kusama';

export const chains: AnyChain[] = [
  ...evmChains,
  ...polkadotChains,
  ...kusamaChains,
];

export const chainsMap = new Map<string, AnyChain>(
  chains.map((chain) => [chain.key, chain])
);

export * from './polkadot';
export * from './evm';
export * from './kusama';
