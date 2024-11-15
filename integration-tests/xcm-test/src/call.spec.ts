import { ChainEcosystem, SubstrateApis } from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import console from 'console';

import { setup, xcm } from './mock';
import { getRouteInfo } from './utils';

const jestConsole = console;

const { configService, init } = setup;
const { runXcm } = xcm;

describe('Wallet with XCM config', () => {
  jest.setTimeout(3 * 60 * 1000); // Execution time <= 3 min

  let wallet: Wallet;

  const blacklist = ['acala-evm'];
  const chains = Array.from(configService.chains.values())
    .filter(
      (c) =>
        c.ecosystem === ChainEcosystem.Polkadot ||
        c.ecosystem === ChainEcosystem.Ethereum
    )
    .filter((c) => !blacklist.includes(c.key));

  beforeAll(async () => {
    global.console = console;
    console.log('Starting suite 👷 ...\n');
    wallet = await init();
  });

  afterAll(async () => {
    global.console = jestConsole;
    await SubstrateApis.getInstance().release();
  });

  it('is defined', () => {
    expect(wallet).toBeDefined();
  });

  describe.each(chains)('should return valid calldata for', (c) => {
    const config = configService.getChainRoutes(c);
    const { chain, routes } = config;

    for (const route of Array.from(routes.values())) {
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
            wallet: wallet,
          };
        }
      );
    }
  });
});
