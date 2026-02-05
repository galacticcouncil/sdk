import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { AnyChain, SubstrateApis } from '@galacticcouncil/xc-core';
import { Wallet } from '@galacticcouncil/xc-sdk';

import * as c from 'console';

import { setup, xc } from './spec/calldata';
import { getRouteKey, getRouteInfo } from './utils/route';

const { configService, init } = setup;
const { runXc } = xc;

const getChains = () => {
  const kusamaChains: string[] = ['assethub_kusama'];

  const polkadotChains: string[] = [
    'astar',
    'assethub',
    'bifrost',
    'crust',
    'interlay',
    'laos',
    'energywebx',
    'hydration',
    'moonbeam',
    'mythos',
    'neuroweb',
    'pendulum',
    'unique',
  ];

  const allowedChains: string[] = [
    ...polkadotChains,
    ...kusamaChains,
    'ethereum',
    'solana',
    'sui',
  ];

  const chains: AnyChain[] = Array.from(configService.chains.values()).filter(
    (c) => allowedChains.includes(c.key)
  );

  return {
    skipFor: ['solana', 'ethereum'],
    chains,
  };
};

describe('Wallet with XC config', () => {
  jest.setTimeout(3 * 60 * 1000); // Execution time <= 3 min

  let wallet: Wallet;

  const ctx = getChains();

  beforeAll(async () => {
    c.log('Starting suite 👷 ...\n');
    wallet = await init();
  });

  afterAll(async () => {
    SubstrateApis.getInstance().release();
  });

  it('is defined', () => {
    expect(wallet).toBeDefined();
  });

  describe.each(ctx.chains)('should return valid calldata for', (c) => {
    const config = configService.getChainRoutes(c);
    const { chain, routes } = config;

    for (const route of Array.from(routes.values())) {
      const { destination } = route;
      const { skipFor } = ctx;

      const allowedDest = ctx.chains.map((c) => c.key);

      if (skipFor.includes(chain.key)) {
        // Skip for those sources
        continue;
      }

      if (!allowedDest.includes(destination.chain.key)) {
        // Skip routes to chains not in our allowed list
        continue;
      }

      const info = getRouteInfo(chain, route);
      const key = getRouteKey(chain, route);

      runXc(
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
