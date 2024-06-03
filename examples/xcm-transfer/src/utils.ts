import { chainsMap } from '@galacticcouncil/xcm-cfg';
import { AnyChain } from '@galacticcouncil/xcm-core';

export function logSrcChains(asset: string, chains: AnyChain[]) {
  const srcChains = chains.map((chain) => chain.name);
  console.log(`The supported source chains for ${asset} are: ${srcChains}`);
}

export function logDestChains(asset: string, chains: AnyChain[]) {
  const destChains = chains.map((chain) => chain.name);
  console.log(
    `The supported destination chains for ${asset} are: ${destChains}`
  );
}

export function logAssets(chain: AnyChain) {
  const assets = [...chain.assetsData.values()].map((a) => a.asset.key);
  console.log(`The supported ${chain.name} assets are: ${assets}`);
}

export function getWormholeChainById(id: number): AnyChain | undefined {
  return Array.from(chainsMap.values()).find(
    (c) => c.isWormholeChain() && c.getWormholeId() === id
  );
}
