import { ChainEcosystem, SubstrateApis } from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import console from 'console';

import { setup, xcm } from './mock';
import { getRouteInfo } from './utils';

const jestConsole = console;

const { configService, init } = setup;
const { runXcm } = xcm;

const getPolkadotChains = () => {
  const blacklist: string[] = ['acala-evm', 'nodle'];
  const chains = Array.from(configService.chains.values())
    .filter(
      (c) =>
        c.ecosystem === ChainEcosystem.Polkadot ||
        c.ecosystem === ChainEcosystem.Ethereum
    )
    .filter((c) => !blacklist.includes(c.key));

  return {
    blacklist,
    chains,
  };
};

const getKusamaChains = () => {
  const blacklist: string[] = [];
  const chains = Array.from(configService.chains.values())
    .filter((c) => c.ecosystem === ChainEcosystem.Kusama)
    .filter((c) => !blacklist.includes(c.key));

  return {
    blacklist,
    chains,
  };
};

describe('Wallet with XCM config', () => {
  jest.setTimeout(3 * 60 * 1000); // Execution time <= 3 min

  let wallet: Wallet;

  const polkadot = getPolkadotChains();
  const kusama = getKusamaChains();

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

  describe.each(polkadot.chains)(
    'should return valid Polkadot calldata for',
    (c) => {
      const config = configService.getChainRoutes(c);
      const { chain, routes } = config;

      for (const route of Array.from(routes.values())) {
        const { blacklist } = polkadot;
        const { destination } = route;

        if (blacklist.includes(destination.chain.key)) {
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
              wallet: wallet,
            };
          }
        );
      }
    }
  );

  describe.each(kusama.chains)(
    'should return valid Kusama calldata for',
    (c) => {
      const config = configService.getChainRoutes(c);
      const { chain, routes } = config;

      for (const route of Array.from(routes.values())) {
        const { blacklist } = kusama;
        const { destination } = route;

        if (blacklist.includes(destination.chain.key)) {
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
              wallet: wallet,
            };
          }
        );
      }
    }
  );
});
