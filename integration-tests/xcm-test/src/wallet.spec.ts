import { writeFileSync } from 'fs';

import {
  AnyChain,
  Asset,
  AssetRoute,
  ChainEcosystem,
  SubstrateApis,
} from '@galacticcouncil/xcm-core';
import {
  BalanceAdapter,
  Erc20Client,
  Metadata,
  TransferAdapter,
  Wallet,
  XCall,
} from '@galacticcouncil/xcm-sdk';

import console from 'console';
import outdent from 'outdent';

import { configService, init } from './wallet';
import { getAddress, getAmount, getRouteKey } from './utils';

import snapshotJson from './snapshot.db.json';

const jestConsole = console;

const BALANCE = 10;
const FEE = 0.1;

/**
 * Construct chain route calldata.
 *
 * For the sake of simplicity following contraints are in place:
 *  - asset & fee balance is 10 units
 *  - source fee is 0.1 unit
 *  - source fee swap is disabled
 *  - erc20 spending cap is same as balance
 *
 * @param wallet - Wallet instance with latest Hydration XCM config
 * @param chain - Origin chain
 * @param route - Origin chain asset transfer route
 * @returns calldata hex string
 */
const getCalldata = async (
  wallet: Wallet,
  chain: AnyChain,
  route: AssetRoute
): Promise<XCall> => {
  const { source, destination } = route;
  const sourceMeta = new Metadata(chain);
  const destinationMeta = new Metadata(destination.chain);

  const srcAddress = getAddress(chain);
  const destAddress = getAddress(destination.chain);

  // Mock transfer & fee asset balances to 10 units
  const readBalanceMock = jest
    .spyOn(BalanceAdapter.prototype, 'read')
    .mockImplementation(async (asset: Asset) => {
      if (asset.isEqual(destination.asset)) {
        return getAmount(BALANCE, asset, destinationMeta);
      }
      return getAmount(BALANCE, asset, sourceMeta);
    });

  // Mock source fee to 0.1 unit
  const estimateFeeMock = jest
    .spyOn(TransferAdapter.prototype, 'estimateFee')
    .mockImplementation(async () => {
      return getAmount(FEE, source.asset, sourceMeta);
    });

  // Mock source fee swap support to false (disabled)
  const isSwapSupportedMock = jest
    .spyOn(wallet.dex, 'isSwapSupported')
    .mockImplementation(() => false);

  // Mock Erc20 spending cap to current balance (10 units)
  const allowanceMock = jest
    .spyOn(Erc20Client.prototype, 'allowance')
    .mockImplementation(async () => {
      const decimals = await sourceMeta.getDecimals(source.asset);
      const balanceBn = BALANCE ** decimals;
      return BigInt(balanceBn);
    });

  const xTransfer = await wallet.transfer(
    source.asset,
    srcAddress,
    chain,
    destAddress,
    destination.chain
  );

  expect(readBalanceMock).toHaveBeenCalled();
  expect(estimateFeeMock).toHaveBeenCalled();
  expect(isSwapSupportedMock).toHaveBeenCalled();

  // Called only if contract bridge transfer from EVM chain, except native
  expect(allowanceMock).toBeDefined();

  return xTransfer.buildCall('1');
};

describe('Wallet with XCM config', () => {
  jest.setTimeout(3 * 60 * 1000); // Execution time <= 3 min

  let wallet: Wallet;

  const snapshot = new Map(Object.entries(snapshotJson));
  const report = new Map();
  const unsupported: string[] = [];
  const chains = Array.from(configService.chains.values())
    .filter(
      (c) =>
        c.ecosystem === ChainEcosystem.Polkadot ||
        c.ecosystem === ChainEcosystem.Ethereum
    )
    .filter((c) => c.key !== 'acala-evm');

  beforeAll(async () => {
    global.console = console;
    console.log('Starting JurAI 👷 ...\n');
    wallet = await init();
  });

  afterAll(async () => {
    global.console = jestConsole;
    await SubstrateApis.getInstance().release();

    // Print routes not present in snapshot (missing validation)
    if (unsupported.length > 0) {
      console.log('\nⓘ  Skipping:\n');
      unsupported.forEach((d) => console.log(d));
      console.log('Please update snapshot !!!\n');
    }

    // Populate snapshot db file on init
    if (snapshot.size === 0) {
      const json = JSON.stringify(Object.fromEntries(report), null, 2);
      const file = ['./src/snapshot.json'].join('');
      writeFileSync(file, json);
    }
  });

  it('is defined', () => {
    expect(wallet).toBeDefined();
  });

  describe('should return valid calldata for', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    for (const c of chains) {
      const config = configService.getChainRoutes(c);
      const { chain, routes } = config;

      for (const route of Array.from(routes.values())) {
        const { source, destination } = route;
        const transferFrom = chain.name;
        const transferTo = destination.chain.name;
        const transferAsset = source.asset;
        const routeInfo = [
          transferFrom,
          '->',
          transferTo,
          transferAsset.originSymbol,
          `[${transferAsset.key}]`,
        ].join(' ');

        const key = getRouteKey(chain, route);
        const calldata = snapshot.get(key);

        it(`${routeInfo} transfer`, async () => {
          const result = await getCalldata(wallet, chain, route);
          if (calldata) {
            expect(result.data).toStrictEqual(calldata);
          } else {
            const info = outdent`
              Route: ${routeInfo}
              Key: ${key}
              Call: ${result.data}\n
            `;
            unsupported.push(info);
          }
          report.set(key, result.data);
        });
      }
    }
  });
});
