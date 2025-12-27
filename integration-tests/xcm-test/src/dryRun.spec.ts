import {
  ChainEcosystem,
  Parachain,
  SubstrateApis,
} from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import { setup, network, xcmDryRun, SetupCtx } from './spec/e2e';

import { getRouteInfo, getRouteKey } from './utils/route';
import { write, loadExisting } from './utils/file';

const DB = 'instructions/test.db.json';

const { configService, initWithCtx } = setup;
const { createNetworks } = network;
const { runXcmDryRun } = xcmDryRun;

/**
 * Supported polkadot consensus ctx.
 *
 * Constraints:
 * 1) Bridge transfers are not executed.
 * 2) Kusama transfers are skipped.
 * 3) Unstable polkadot chains are skipped (e.g. slow rpc's).
 *
 * @returns chains execution ctx
 */
const getPolkadotChains = () => {
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

  const skipFor: string[] = [...bridge, ...kusamaIgnore, ...polkadotIgnore];
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
    networks = await createNetworks(polkadot.chains);
    const ctx = networks.find((n) => n.config.key === 'hydration')!;
    wallet = await initWithCtx(ctx);
  });

  afterAll(async () => {
    await SubstrateApis.getInstance().release();
    await Promise.all(networks.map((network) => network.teardown()));
    /*     reportCtx.forEach((v, k) => {
      write(v, 'instructions/' + k + '.json', false);
    }); */
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

        const isContractTransfer = !!route.contract;
        const isAcalaErc20Transfer = asset.key.endsWith('_awh');

        runXcmDryRun(
          `${info} dryRun`,
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
            skip: isContractTransfer || isAcalaErc20Transfer,
            sync: true,
            snapshot: true,
          }
        );
      }
    }
  );
});
