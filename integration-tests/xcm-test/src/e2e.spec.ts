import { AnyChain, Parachain, SubstrateApis } from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import { jest } from '@jest/globals';

import * as c from 'console';
import outdent from 'outdent';

import { setup, network, xcm, SetupCtx } from './spec/e2e';

import { parseArgs } from './utils/cmd';
import { getRouteInfo, getRouteKey } from './utils/route';
import { write, loadExisting } from './utils/file';

const DB = 'metadata.db.json';

const { configService, initWithCtx } = setup;
const { createNetworks } = network;
const { runXcm } = xcm;

const usage = outdent`
  Usage:
    npm run test:e2e

  Options: 
    -key      Execute transfer for given key
    -chain    Execute transfers from given chain

  Examples:
    npm run test:e2e -- -key hydration-moonbeam-glmr
    npm run test:e2e -- -chain hydration
`;

const getChains = () => {
  const polkadotChains: string[] = [
    'polkadot',
    'assethub',
    'bifrost',
    'crust',
    'laos',
    'hydration',
    'moonbeam',
    'mythos',
    'neuroweb',
    'pendulum',
    'unique',
  ];

  const allowedChains: string[] = [...polkadotChains];

  const chains: AnyChain[] = Array.from(configService.chains.values()).filter(
    (c) => allowedChains.includes(c.key)
  );

  return {
    skipFor: [],
    chains,
  };
};

describe('Wallet with XCM config', () => {
  jest.setTimeout(3 * 60 * 1000); // Execution time <= 3 min
  c.log(usage + '\n');

  const args = process.argv.slice(2);
  const params = parseArgs(args);

  const keyParam = params['key'];
  const chainParam = params['chain'];

  let wallet: Wallet;
  let networks: SetupCtx[] = [];

  const reportCtx = loadExisting(DB);
  const { chains, skipFor } = getChains();

  beforeAll(async () => {
    networks = await createNetworks(chains as Parachain[]);
    const ctx = networks.find((n) => n.config.key === 'hydration')!;
    wallet = await initWithCtx(ctx);
  });

  afterAll(async () => {
    await SubstrateApis.getInstance().release();
    await Promise.all(networks.map((network) => network.teardown()));
    write(reportCtx, DB);
  });

  it('is defined', () => {
    expect(configService).toBeDefined();
  });

  describe.each(chains.filter((c) => c.key !== 'polkadot'))(
    'should result in valid Polkadot transfer for',
    (c) => {
      const config = configService.getChainRoutes(c);
      const { chain, routes } = config;

      for (const route of Array.from(routes.values())) {
        const { source, destination } = route;
        const { asset } = source;

        const allowedDest = chains.map((c) => c.key);

        if (!allowedDest.includes(destination.chain.key)) {
          continue;
        }

        const info = getRouteInfo(chain, route);
        const key = getRouteKey(chain, route);

        const isKeyConstraint = keyParam ? keyParam !== key : false;
        const isChainConstraint = chainParam ? chainParam !== chain.key : false;

        const isContractTransfer = !!route.contract;
        const isAcalaErc20Transfer = asset.key.endsWith('_awh');
        const isMissingReserveChain = ['astr', 'ibtc'].includes(asset.key);

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
              report: reportCtx,
              networks: networks,
              wallet: wallet,
            };
          },
          {
            skip:
              isKeyConstraint ||
              isChainConstraint ||
              isContractTransfer ||
              isAcalaErc20Transfer ||
              isMissingReserveChain,
            sync: true,
            snapshot: true,
          }
        );
      }
    }
  );
});
