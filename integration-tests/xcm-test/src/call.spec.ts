import {
  ChainEcosystem,
  Parachain,
  SubstrateApis,
} from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import * as c from 'console';

import { setup, xcm } from './spec/calldata';

import { getRouteInfo, getRouteKey } from './utils/route';

const { configService, init } = setup;
const { runXcm } = xcm;

const getChains = () => {
  const bridge: string[] = ['ethereum', 'solana', 'sui'];
  const kusamaIgnore: string[] = ['kusama', 'assethub_kusama'];
  const polkadotIgnore: string[] = [
    'acala',
    'ajuna',
    'centrifuge',
    'crust',
    'darwinia',
    'interlay',
    'kilt',
    'laos',
    'energywebx',
    'neuroweb',
    'nodle',
    'pendulum',
    'subsocial',
    'unique',
    'zeitgeist',
  ];

  const skipFor: string[] = [...kusamaIgnore, ...polkadotIgnore];
  const chains: Parachain[] = Array.from(configService.chains.values())
    .filter((c) => c instanceof Parachain)
    .filter((c) => c.ecosystem === ChainEcosystem.Polkadot)
    .filter((c) => !skipFor.includes(c.key));

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
