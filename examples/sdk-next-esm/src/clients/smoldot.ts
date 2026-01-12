import { getSmProvider as getSm } from 'polkadot-api/sm-provider';
import { start } from 'polkadot-api/smoldot';

import { chainSpec as relayChainSpec } from 'polkadot-api/chains/polkadot';
import { chainSpec as hydrationChainSpec } from '../spec/hydration';

export async function getSmProvider() {
  const smoldot = start();

  // 1) add relay first
  const relay = await smoldot.addChain({ chainSpec: relayChainSpec });

  // 2) add hydration
  const hydration = await smoldot.addChain({
    chainSpec: hydrationChainSpec,
    potentialRelayChains: [relay],
  });

  return getSm(hydration);
}
