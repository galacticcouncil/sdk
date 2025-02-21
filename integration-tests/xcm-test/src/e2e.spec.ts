import {
  ChainEcosystem,
  Parachain,
  SubstrateApis,
} from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import * as c from 'console';
import outdent from 'outdent';

import { setup, network, xcm, SetupCtx } from './ctx/e2e';

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

/**
 * Supported polkadot consensus ctx.
 *
 * Constraints:
 * 1) Bridge transfers are not executed.
 * 2) Nodle is skipped (unstable rpc's).
 *
 * @returns chains execution ctx
 */
const getPolkadotChains = () => {
  const bridge: string[] = ['ethereum', 'solana'];
  const skipFor: string[] = bridge.concat(['nodle', 'subsocial']);
  const chains: Parachain[] = Array.from(configService.chains.values())
    .filter((c) => c instanceof Parachain)
    .filter((c) => c.ecosystem === ChainEcosystem.Polkadot)
    .filter((c) => !skipFor.includes(c.key));

  return {
    skipFor,
    bridge,
    //chains,
    chains: Array.from(configService.chains.values()).filter((c) =>
      ['polkadot', 'assethub', 'hydration'].includes(c.key)
    ) as Parachain[],
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
  const polkadot = getPolkadotChains();

  beforeAll(async () => {
    networks = await createNetworks(polkadot.chains);
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

  describe.each(polkadot.chains)(
    'should result in valid Polkadot transfer for',
    (c) => {
      const config = configService.getChainRoutes(c);
      const { chain, routes } = config;

      for (const route of Array.from(routes.values())) {
        const { skipFor } = polkadot;
        const { source, destination } = route;
        const { asset } = source;

        if (skipFor.includes(destination.chain.key)) {
          continue;
        }

        const info = getRouteInfo(chain, route);
        const key = getRouteKey(chain, route);

        const isKeyConstraint = keyParam ? keyParam !== key : false;
        const isChainConstraint = chainParam ? chainParam !== chain.key : false;

        const isContractTransfer = !!route.contract;
        const isAcalaErc20Transfer = asset.key.endsWith('_awh');

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
              isAcalaErc20Transfer,
            sync: true,
            snapshot: true,
          }
        );
      }
    }
  );
});
