import { ChainEcosystem, SubstrateApis } from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import * as c from 'console';

import { setup, xcm } from './ctx/call';

import { getRouteInfo, getRouteKey } from './utils/route';

const { configService, init } = setup;
const { runXcm } = xcm;

const getPolkadotChains = () => {
  //const skipFor: string[] = ['nodle', 'subsocial', 'tinkernet'];
  const skipFor = Array.from(configService.chains.values())
    .map((c) => c.key)
    .filter(
      (c) =>
        ![
          'hydration',
          'moonbeam',
          'polkadot',
          'assethub',
          'ethereum',
          'solana',
        ].includes(c)
    );

  const chains = Array.from(configService.chains.values())
    .filter(
      (c) =>
        c.ecosystem === ChainEcosystem.Polkadot ||
        c.ecosystem === ChainEcosystem.Ethereum ||
        c.ecosystem === ChainEcosystem.Solana
    )
    .filter((c) => !skipFor.includes(c.key));

  return {
    skipFor,
    chains,
  };
};

const getKusamaChains = () => {
  const skipFor: string[] = [];
  const chains = Array.from(configService.chains.values())
    .filter((c) => c.ecosystem === ChainEcosystem.Kusama)
    .filter((c) => !skipFor.includes(c.key));

  return {
    skipFor,
    chains,
  };
};

describe('Wallet with XCM config', () => {
  jest.setTimeout(3 * 60 * 1000); // Execution time <= 3 min

  let wallet: Wallet;

  const polkadot = getPolkadotChains();
  //const kusama = getKusamaChains();

  beforeAll(async () => {
    c.log('Starting suite 👷 ...\n');
    wallet = await init();
  });

  afterAll(async () => {
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
        const { skipFor } = polkadot;
        const { destination } = route;

        if (skipFor.includes(destination.chain.key)) {
          continue;
        }

        const info = getRouteInfo(chain, route);
        const key = getRouteKey(chain, route);

        runXcm(
          `${info} transfer`,
          async () => {
            return {
              chain: chain,
              route: route,
              key: key,
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

  // describe.each(kusama.chains)(
  //   'should return valid Kusama calldata for',
  //   (c) => {
  //     const config = configService.getChainRoutes(c);
  //     const { chain, routes } = config;

  //     for (const route of Array.from(routes.values())) {
  //       const { skipFor } = kusama;
  //       const { destination } = route;

  //       if (skipFor.includes(destination.chain.key)) {
  //         continue;
  //       }

  //       const info = getRouteInfo(chain, route);
  //       const key = getRouteKey(chain, route);

  //       runXcm(
  //         `${info} transfer`,
  //         async () => {
  //           return {
  //             chain: chain,
  //             route: route,
  //             key: key,
  //           };
  //         },
  //         async () => {
  //           return {
  //             wallet: wallet,
  //           };
  //         }
  //       );
  //     }
  //   }
  // );
});
