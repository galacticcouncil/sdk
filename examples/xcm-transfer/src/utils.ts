import { AnyChain } from '@moonbeam-network/xcm-types';

export function logSrcChains(asset: string, chains: AnyChain[]) {
  const srcChains = chains.map((chain) => chain.name);
  console.log(`The supported source chains for ${asset} are: ${srcChains}`);
}

export function logDestChains(asset: string, chains: AnyChain[]) {
  const destChains = chains.map((chain) => chain.name);
  console.log(`The supported destination chains for ${asset} are: ${destChains}`);
}

export function logAssets(chain: AnyChain) {
  const assets = [...chain.assetsData.values()].map((a) => a.asset.key);
  console.log(`The supported hydraDX assets are: ${assets}`);
}
