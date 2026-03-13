import { chainsMap } from '@galacticcouncil/xc-cfg';
import { AnyChain, Wormhole } from '@galacticcouncil/xc-core';

export function getWormholeChainById(id: number): AnyChain | undefined {
  return Array.from(chainsMap.values()).find(
    (c) => Wormhole.isKnown(c) && Wormhole.fromChain(c).getWormholeId() === id
  );
}
