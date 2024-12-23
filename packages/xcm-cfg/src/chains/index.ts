import { AnyChain } from '@galacticcouncil/xcm-core';

import { evmChains } from './evm';
import { polkadotChains } from './polkadot';
import { solanaChains } from './solana';
import { kusamaChains } from './kusama';

export const chains: AnyChain[] = [
  ...evmChains,
  ...polkadotChains,
  ...solanaChains,
  ...kusamaChains,
];

export const chainsMap = new Map<string, AnyChain>(
  chains.map((chain) => [chain.key, chain])
);

export * from './evm';
export * from './polkadot';
export * from './solana';
export * from './kusama';
