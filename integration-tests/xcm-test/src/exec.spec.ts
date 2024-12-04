import {
  AnyChain,
  ConfigBuilder,
  Parachain,
  SubstrateApis,
} from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import console from 'console';

import { setup, network, xcm, SetupCtx } from './ctx/e2e';

import { parseArgs } from './utils/cmd';
import { write, loadExisting } from './utils/file';
import { getRouteInfo } from './utils/route';

const jestConsole = console;
const DB = 'metadata.db.json';

const { configService, initWithCtx } = setup;
const { createNetworks } = network;
const { runXcm } = xcm;

const getKey = () => {
  const args = process.argv.slice(2);
  const params = parseArgs(args);
  const key = params['key'];

  if (!key) {
    console.error(
      'Please specify transfer key.\n Example: npm run test:exec -- -key hydration-assethub-ded'
    );
    process.exit(1);
  }

  return key;
};

const getChainsCtx = (source: AnyChain, destination: AnyChain) => {
  const relay = configService.getChain('polkadot');
  const dex = configService.getChain('hydration');

  const base = [source, destination];

  const isRelayTransfer = [source.key, destination.key].includes(relay.key);
  if (!isRelayTransfer) {
    base.push(relay);
  }

  const isDexTransfer = [source.key, destination.key].includes(dex.key);
  if (!isDexTransfer) {
    base.push(dex);
  }

  return base as Parachain[];
};

describe('Wallet with XCM config', () => {
  jest.setTimeout(3 * 60 * 1000); // Execution time <= 3 min

  let wallet: Wallet;
  let networks: SetupCtx[] = [];

  const reportCtx = loadExisting(DB);

  const key = getKey();
  const [srcChainKey, destChainKey, assetKey] = key.split('-');

  const srcChain = configService.getChain(srcChainKey);
  const destChain = configService.getChain(destChainKey);
  const asset = configService.getAsset(assetKey);

  beforeAll(async () => {
    global.console = console;
    const chains = getChainsCtx(srcChain, destChain);
    networks = await createNetworks(chains);
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

  describe('should result in valid Polkadot transfer for', () => {
    const transfer = ConfigBuilder(configService)
      .assets()
      .asset(asset)
      .source(srcChain)
      .destination(destChain)
      .build();

    const { chain, route } = transfer.origin;
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
        sync: true,
        snapshot: true,
      }
    );
  });
});
