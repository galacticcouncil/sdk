import { SubstrateApis } from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import * as c from 'console';

import { setup, xcm } from './spec/calldata';

import { getRouteInfo, getRouteKey } from './utils/route';

const { configService, init } = setup;
const { runXcm } = xcm;

const getChains = () => {
  const skipFor: string[] = ['nodle', 'subsocial', 'tinkernet'];
  const chains = Array.from(configService.chains.values()).filter(
    (c) => !skipFor.includes(c.key)
  );

  return {
    skipFor,
    chains,
  };
};

describe('Wallet with XCM config', () => {
  jest.setTimeout(3 * 60 * 1000); // Execution time <= 3 min

  let wallet: Wallet;

  const ctx = getChains();

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

  describe.each(ctx.chains)('should return valid calldata for', (c) => {
    const config = configService.getChainRoutes(c);
    const { chain, routes } = config;

    for (const route of Array.from(routes.values())) {
      const { skipFor } = ctx;
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
  });
});
