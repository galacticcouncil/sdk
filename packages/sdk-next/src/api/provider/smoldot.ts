import { getSmProvider } from 'polkadot-api/sm-provider';

import { chainSpec } from './chainspec/hydration';

export async function getSm() {
  const { start } = await import('polkadot-api/smoldot');
  const { chainSpec: relayChainSpec } =
    await import('polkadot-api/chains/polkadot');

  const smoldot = start();

  // 1) add relay first
  const relay = await smoldot.addChain({ chainSpec: relayChainSpec });

  // 2) add hydration
  const hydration = await smoldot.addChain({
    chainSpec: chainSpec,
    potentialRelayChains: [relay],
  });

  return getSmProvider(hydration);
}
