import { connectParachains, connectVertical } from '@acala-network/chopsticks';
import { setupContext } from '@acala-network/chopsticks-testing';
import { Parachain } from '@galacticcouncil/xcm-core';

import * as c from 'console';

import { initStorage } from './storage';
import { SetupCtx } from './types';

const wasms: Record<string, string> = {
  hydration: 'hydradx_runtime.compact.compressed.wasm',
};

export async function createNetwork(chain: Parachain): Promise<SetupCtx> {
  const ctx = await setupContext({
    endpoint: chain.ws,
    wasmOverride: wasms[chain.key],
  });

  const chainStorage = await initStorage(ctx.api, chain);
  c.log('🥢 ' + chain.name + ' storage ready.');
  await ctx.dev.setStorage(chainStorage);
  return {
    ...ctx,
    config: chain,
  };
}

export async function createNetworks(chains: Parachain[]): Promise<SetupCtx[]> {
  const networks = await Promise.all(chains.map(createNetwork));
  const relaychain = networks.find(({ config }) => config.parachainId === 0);
  const parachains = networks.filter(({ config }) => config.parachainId > 0);

  await connectParachains(
    parachains.map(({ chain }) => chain),
    true
  );
  if (relaychain) {
    for (const parachain of parachains) {
      await connectVertical(relaychain.chain, parachain.chain);
    }
  }

  return networks;
}
