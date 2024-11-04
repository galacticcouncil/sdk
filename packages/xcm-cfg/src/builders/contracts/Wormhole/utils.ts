import { AnyChain } from '@galacticcouncil/xcm-core';

export function wormholeGuard(chain: AnyChain) {
  if (!chain.isWormholeChain()) {
    throw new Error(chain.name + ' is not supported Wormhole chain.');
  }
}
