import { AnyChain } from '@galacticcouncil/xc-core';

import { evmChains } from './evm';
import { polkadotChains } from './polkadot';
import { solanaChains } from './solana';
import { suiChains } from './sui';
import { kusamaChains } from './kusama';
import { nearChains } from './near';
import { zcashChains } from './zcash';

export const chains: AnyChain[] = [
  ...evmChains,
  ...polkadotChains,
  ...solanaChains,
  ...suiChains,
  ...kusamaChains,
  ...nearChains,
  ...zcashChains,
];

export const chainsMap = new Map<string, AnyChain>(
  chains.map((chain) => [chain.key, chain])
);

export * from './evm';
export * from './polkadot';
export * from './solana';
export * from './sui';
export * from './kusama';
export * from './near';
export * from './zcash';
