import { Parachain } from '@galacticcouncil/xc-core';
import { SubstrateApis } from '@galacticcouncil/common';
import { Wallet } from '@galacticcouncil/xc-sdk';

import { jest } from '@jest/globals';

import * as c from 'console';

import { setup, network, xc, SetupCtx } from './spec/e2e';

import { parseArgs } from './utils/cmd';
import { getRouteInfo, getRouteKey } from './utils/route';
import { write, loadExisting } from './utils/file';

const DB = 'metadata.db.json';

const { configService, initWithCtx } = setup;
const { createNetworks } = network;
const { runXc, getAssetReserve } = xc;

const wasmOverrides: Record<string, string> = {};

const usage = `Usage:
  npm run spec:e2e

Options:
  -key      Execute transfer for given key
  -chain    Execute transfers from given chain

Examples:
  npm run spec:e2e -- -key hydration-assethub-dot
  npm run spec:e2e -- -chain hydration`;

/**
 * Supported polkadot consensus ctx.
 *
 * Constraints:
 * 1) Bridge transfers (ethereum, solana, sui) are skipped as sources.
 * 2) Kusama chains are excluded.
 * 3) EVM-only chains not yet supported in e2e.
 */
const getChains = () => {
  const bridge: string[] = ['ethereum', 'solana', 'sui'];
  const allowedChains: string[] = [
    'polkadot',
    'hydration',
    'assethub',
    'bifrost',
    'moonbeam',
  ];

  const chains: Parachain[] = Array.from(configService.chains.values())
    .filter((c) => c instanceof Parachain)
    .filter((c) => allowedChains.includes(c.key));

  return {
    skipFor: [...bridge],
    chains,
  };
};

describe('Wallet with XC config (E2E)', () => {
  jest.setTimeout(10 * 60 * 1000); // Execution time <= 10 min
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
    networks = await createNetworks(chains, wasmOverrides);
    wallet = await initWithCtx(networks);
  });

  afterAll(async () => {
    SubstrateApis.getInstance().release();
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

        if (skipFor.includes(destination.chain.key)) {
          continue;
        }

        const info = getRouteInfo(chain, route);
        const key = getRouteKey(chain, route);

        const isKeyConstraint = keyParam ? keyParam !== key : false;
        const isChainConstraint = chainParam ? chainParam !== chain.key : false;

        const isContractTransfer = !!route.contract;
        const isAcalaErc20Transfer = asset.key.endsWith('_awh');
        const isUnsupported = ['wud'].includes(asset.key);

        // Skip if the asset's reserve chain is not in the test network
        const srcChain = chain as Parachain;
        const destChain = destination.chain as Parachain;
        const reserveId = getAssetReserve(srcChain, route);
        const isMissingReserve =
          Number.isFinite(reserveId) &&
          reserveId !== srcChain.parachainId &&
          reserveId !== destChain.parachainId &&
          !chains.some((c) => c.parachainId === reserveId);

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
              isUnsupported ||
              isMissingReserve,
            sync: true,
            snapshot: true,
          }
        );
      }
    }
  );
});
