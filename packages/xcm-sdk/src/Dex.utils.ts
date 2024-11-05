import { AnyChain, ChainEcosystem, Parachain } from '@galacticcouncil/xcm-core';

const isHydration = (c: AnyChain) =>
  c instanceof Parachain &&
  c.ecosystem === ChainEcosystem.Polkadot &&
  c.parachainId === 2034;

const isBasilisk = (c: AnyChain) =>
  c instanceof Parachain &&
  c.ecosystem === ChainEcosystem.Kusama &&
  c.parachainId === 2090;

export const IS_DEX = (c: AnyChain) => isHydration(c) || isBasilisk(c);

export const IS_HUB = (c: AnyChain) =>
  c instanceof Parachain && c.parachainId === 1000;

export const findChain = (
  chains: Map<string, AnyChain>,
  chainContraint: (c: AnyChain) => boolean,
  chainId: string
) => {
  const chain = Array.from(chains.values()).find(chainContraint);
  if (chain) {
    return chain as Parachain;
  } else {
    throw new Error(chainId + ' parachain config is missing');
  }
};
