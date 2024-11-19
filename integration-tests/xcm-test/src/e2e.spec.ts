import {
  ChainEcosystem,
  Parachain,
  SubstrateApis,
} from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import console from 'console';

import { setup, network, xcm, SetupCtx } from './e2e';
import { getRouteInfo } from './utils';
import { write, loadExisting } from './file';

const jestConsole = console;
const DB = 'metadata.db.json';

const { configService, initWithCtx } = setup;
const { createNetworks } = network;
const { runXcm } = xcm;

const getPolkadotChains = () => {
  const bridge: string[] = ['ethereum'];
  const blacklist: string[] = bridge.concat(['acala-evm', 'nodle']);
  const chains: Parachain[] = Array.from(configService.chains.values())
    .filter((c) => c instanceof Parachain)
    .filter((c) => c.ecosystem === ChainEcosystem.Polkadot)
    .filter((c) => !blacklist.includes(c.key));

  return {
    blacklist,
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
        const { blacklist } = polkadot;
        const { destination } = route;

        if (blacklist.includes(destination.chain.key)) {
          continue;
        }

        const isContractTransfer = !!route.contract;

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
            skip: isContractTransfer,
          }
        );
      }
    }
  );
});
