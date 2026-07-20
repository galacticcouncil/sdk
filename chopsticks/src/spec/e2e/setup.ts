import { pool, evm } from '@galacticcouncil/sdk-next';
import {
  assetsMap,
  chainsMap,
  routesMap,
  validations,
  dex,
  HydrationConfigService,
} from '@galacticcouncil/xc-cfg';
import { Parachain } from '@galacticcouncil/xc-core';

import { Wallet } from '@galacticcouncil/xc-sdk';

import { SetupCtx } from './types';

const { PoolContextProvider } = pool;
const { EvmClient } = evm;

export const configService = new HydrationConfigService({
  assets: assetsMap,
  chains: chainsMap,
  routes: routesMap,
});

/**
 * Override Parachain.client getters for all networked chains so any
 * SDK code that accesses chain.client gets the Chopsticks-backed client.
 */
const overrideClients = (networks: SetupCtx[]) => {
  for (const n of networks) {
    const chain = configService.getChain(n.config.key);
    if (chain instanceof Parachain) {
      const chopsticksClient = n.client;
      Object.defineProperty(chain, 'client', {
        get: () => chopsticksClient,
        configurable: true,
      });
    }
  }
};

/**
 * Full init for e2e tests.
 * Overrides chain clients AND sets up SDK context with dex registrations.
 */
export const initWithCtx = async (
  networks: SetupCtx[]
): Promise<Wallet> => {
  overrideClients(networks);

  const wallet = new Wallet({
    configService: configService,
    transferValidations: validations,
  });

  // Register dex-es
  const hydrationCtx = networks.find((n) => n.config.key === 'hydration');
  if (hydrationCtx) {
    const hydration = configService.getChain('hydration') as Parachain;
    const evmClient = new EvmClient(hydrationCtx.client);
    const poolCtx = new PoolContextProvider(hydrationCtx.client, evmClient)
      .withOmnipool()
      .withStableswap();

    const hydrationDex = new dex.HydrationDex(hydration, poolCtx);
    hydration.registerDex(hydrationDex);
  }

  const assethubCtx = networks.find((n) => n.config.key === 'assethub');
  if (assethubCtx) {
    const assethub = configService.getChain('assethub') as Parachain;
    const assethubDex = new dex.AssethubDex(assethub);
    assethub.registerDex(assethubDex);
  }

  return wallet;
};
