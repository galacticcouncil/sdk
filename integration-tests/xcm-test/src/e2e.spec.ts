import {
  ChainEcosystem,
  Parachain,
  SubstrateApis,
} from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import console from 'console';

import { setup, network, xcm, SetupCtx } from './ctx/e2e';

import { getRouteInfo } from './utils/route';
import { write, loadExisting } from './utils/file';

const jestConsole = console;
const DB = 'metadata.db.json';

const { configService, initWithCtx } = setup;
const { createNetworks } = network;
const { runXcm } = xcm;

/**
 * Supported polkadot consensus ctx.
 *
 * Constraints:
 * 1) Bridge transfers are not executed.
 * 2) Acala EVM is skipped (testing chain)
 * 2) Nodle is skipped (unstable rpc's)
 * 3) Phala is skipped (unstable rpc's)
 *
 * @returns chains execution ctx
 */
const getPolkadotChains = () => {
  const bridge: string[] = ['ethereum'];
  const skipFor: string[] = bridge.concat(['acala-evm', 'nodle', 'phala']);
  const chains: Parachain[] = Array.from(configService.chains.values())
    .filter((c) => c instanceof Parachain)
    .filter((c) => c.ecosystem === ChainEcosystem.Polkadot)
    .filter((c) => !skipFor.includes(c.key));

  return {
    skipFor,
    bridge,
    chains,
  };
};

describe('Wallet with XCM config', () => {
  jest.setTimeout(3 * 60 * 1000); // Execution time <= 3 min

  let wallet: Wallet;
  let networks: SetupCtx[] = [];

  const reportCtx = loadExisting(DB);
  const polkadot = getPolkadotChains();

  beforeAll(async () => {
    global.console = console;
    networks = await createNetworks(polkadot.chains);
    const ctx = networks.find((n) => n.config.key === 'hydration')!;
    wallet = await initWithCtx(ctx);
  });

  afterAll(async () => {
    global.console = jestConsole;
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

        if (skipFor.includes(destination.chain.key)) {
          continue;
        }

        const isContractTransfer = !!route.contract;
        const isAcalaErc20Transfer = source.asset.key.endsWith('_awh');

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
              report: reportCtx,
              networks: networks,
              wallet: wallet,
            };
          },
          {
            skip: isContractTransfer || isAcalaErc20Transfer,
            sync: true,
            snapshot: true,
          }
        );
      }
    }
  );
});
