import { AnyChain } from '@galacticcouncil/xcm-core';

export function wormholeOrError(chain: AnyChain) {
  if (!chain.isWormholeChain()) {
    throw new Error(chain.name + ' is not supported Wormhole chain.');
  }
}
