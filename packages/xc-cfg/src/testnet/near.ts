import {
  ChainRoutes,
  ConfigService,
  EvmParachain,
  NttTokenDef,
  Wormhole,
} from '@galacticcouncil/xc-core';

import { near, wnear } from '../assets';
import { hydration, near_testnet } from '../chains';
import { toHydrationViaNttTemplate } from '../configs/near/templates';
import { viaNttTemplate } from '../configs/polkadot/hydration/templates';

/** The fork's wNEAR - mainnet's next free asset id when it was deployed. */
const FORK_WNEAR_ID = 1355;

/**
 * whm near-ntt hydration leg, BURNING over the fork asset's erc20 precompile.
 *
 * - Deployed by whm `_probeNearNttDelivery.ts` from a fixed deployer, so the
 *   addresses are known ahead and the NEAR testnet contract is peered to them
 */
const FORK_WNEAR_NTT: NttTokenDef = {
  token: '0x000000000000000000000000000000010000054b',
  manager: '0x5b1334885320cFd7158760256c7bD0Af58006b09',
  transceiver: {
    wormhole: '0x5e875F689EA8dd25e11a69cfb6C9f844C4b3B207',
  },
};

/**
 * Register NEAR testnet <-> hydration over ntt.
 *
 * - The NEAR side is the live testnet deployment of whm near-ntt
 * - No wormhole testnet observes hydration, so its leg exists only on a
 *   chopsticks fork, where a testnet vaa is delivered against a substituted
 *   guardian set
 * - Kept out of the default config: the fork's wNEAR asset id is the one
 *   mainnet hands to its next registration
 * - Mutates the shared hydration chain, as registering external assets does
 *
 * @param config - config service to register the routes on
 */
export function registerNear(config: ConfigService): void {
  const chain = config.getChain(hydration) as EvmParachain;
  chain.updateAsset({
    asset: wnear,
    decimals: 24,
    id: FORK_WNEAR_ID,
  });
  Wormhole.fromChain(chain).ntt[wnear.key] = FORK_WNEAR_NTT;

  config.updateAsset(wnear);
  config.updateChain(near_testnet);
  config.updateRoutes(
    new ChainRoutes({
      chain: near_testnet,
      routes: [
        toHydrationViaNttTemplate(wnear, wnear),
        toHydrationViaNttTemplate(near, wnear),
      ],
    })
  );
  config.updateChainRoute(chain, viaNttTemplate(wnear, wnear, near_testnet));
}
