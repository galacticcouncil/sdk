import {
  ChainEcosystem,
  Parachain,
  SubstrateApis,
} from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import console from 'console';

import { setup, network, xcm, SetupCtx } from './e2e';
import { getRouteInfo } from './utils';

const jestConsole = console;

const { configService, initWithCtx } = setup;
const { createNetworks } = network;
const { runXcm } = xcm;

describe('Wallet with XCM config', () => {
  jest.setTimeout(3 * 60 * 1000); // Execution time <= 3 min

  let wallet: Wallet;
  let networks: SetupCtx[] = [];

  const blacklist = ['acala-evm', 'acala', 'nodle'];
  const bridge = ['ethereum'];
  const chains = Array.from(configService.chains.values())
    .filter((c) => c instanceof Parachain)
    .filter((c) => c.ecosystem === ChainEcosystem.Polkadot)
    .filter((c) => !blacklist.includes(c.key));

  beforeAll(async () => {
    global.console = console;
    networks = await createNetworks(chains);
    const ctx = networks.find((n) => n.config.key === 'hydration')!;
    wallet = await initWithCtx(ctx);
  });

  afterAll(async () => {
    global.console = jestConsole;
    await Promise.all(networks.map((network) => network.teardown()));
    await SubstrateApis.getInstance().release();
  });

  it('is defined', () => {
    expect(configService).toBeDefined();
  });

  describe.each(chains)('should result in valid transfer for', (c) => {
    const config = configService.getChainRoutes(c);
    const { chain, routes } = config;

    for (const route of Array.from(routes.values())) {
      const skip = bridge
        .concat(blacklist)
        .includes(route.destination.chain.key);
      if (skip) {
        continue;
      }

      const info = getRouteInfo(chain, route);
      runXcm(
        `${info} transfer`,
        async () => {
          return {
            chain: chain,
            route: route,
          };
        },
        async () => {
          return {
            networks: networks,
            wallet: wallet,
          };
        },
        {
          skip:
            chain.key != 'hydration' ||
            route.destination.chain.key != 'zeitgeist',
          //route.source.asset.key != 'wbtc_mwh',
        }
      );
    }
  });
});
