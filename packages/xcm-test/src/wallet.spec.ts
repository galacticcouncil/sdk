import { writeFileSync } from 'fs';

import {
  AnyChain,
  Asset,
  AssetRoute,
  ChainEcosystem,
  Parachain,
  SubstrateApis,
} from '@galacticcouncil/xcm-core';
import {
  Erc20Client,
  Metadata,
  TransferService,
  Wallet,
  XCall,
} from '@galacticcouncil/xcm-sdk';

import console from 'console';
import outdent from 'outdent';

import { configService, init } from './wallet';
import { getAddress, getAmount, getRouteKey } from './utils';

import snapshotJson from './snapshot.json';

const jestConsole = console;

const BALANCE = 10;
const FEE = 0.1;
const FEE_BALANCE = 1;

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

  const getBalanceMock = jest
    .spyOn(TransferService.prototype, 'getBalance')
    .mockImplementation(async () =>
      getAmount(BALANCE, source.asset, sourceMeta)
    );

  const getFeeBalanceMock = jest
    .spyOn(TransferService.prototype, 'getFeeBalance')
    .mockImplementation(async () => {
      if (source.fee) {
        const feeAsset = source.fee.asset;
        const asset: Asset =
          'build' in feeAsset
            ? await feeAsset
                .build({
                  chain: chain as Parachain,
                  address: srcAddress,
                })
                .call()
            : feeAsset;
        return getAmount(FEE, asset, sourceMeta);
      }
      return getAmount(FEE, source.asset, sourceMeta);
    });

  const getDestinationFeeBalanceMock = jest
    .spyOn(TransferService.prototype, 'getDestinationFeeBalance')
    .mockImplementation(async () => {
      return getAmount(FEE_BALANCE, destination.fee.asset, destinationMeta);
    });

  const getDestinationFeeMock = jest
    .spyOn(TransferService.prototype, 'getDestinationFee')
    .mockImplementation(async () => {
      return getAmount(FEE, destination.fee.asset, destinationMeta);
    });

  const getFeeMock = jest
    .spyOn(TransferService.prototype, 'getFee')
    .mockImplementation(async () => {
      return getAmount(FEE, source.asset, sourceMeta);
    });

  const isSwapSupportedMock = jest
    .spyOn(wallet.dex, 'isSwapSupported')
    .mockImplementation(() => false);

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

  expect(getBalanceMock).toHaveBeenCalled();
  expect(getFeeBalanceMock).toHaveBeenCalled();
  expect(getDestinationFeeBalanceMock).toHaveBeenCalled();
  expect(getDestinationFeeMock).toHaveBeenCalled();
  expect(getFeeMock).toHaveBeenCalled();
  expect(isSwapSupportedMock).toHaveBeenCalled();

  expect(allowanceMock).toBeDefined();

  return xTransfer.buildCall('1');
};

describe('Wallet', () => {
  jest.setTimeout(2 * 60 * 1000); // Max execution time 2 min

  let wallet: Wallet;

  const snapshot = new Map(Object.entries(snapshotJson));
  const report = new Map();
  const chains = Array.from(configService.chains.values())
    .filter(
      (c) =>
        c.ecosystem === ChainEcosystem.Polkadot ||
        c.ecosystem === ChainEcosystem.Ethereum
    )
    .filter((c) => c.key !== 'acala-evm');

  beforeAll(async () => {
    global.console = console;
    wallet = await init();
    console.log('\nStarting JurAI 👷 ...\n');
  });

  afterAll(async () => {
    global.console = jestConsole;
    SubstrateApis.getInstance().release();

    if (snapshot.size === 0) {
      // Initialize snapshot from report on boot
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

      for (const [_, route] of routes.entries()) {
        const { source, destination } = route;
        const transferFrom = chain.name;
        const transferTo = destination.chain.name;
        const transferAsset = source.asset.originSymbol;

        const key = getRouteKey(chain, route);
        const calldata = snapshot.get(key);

        it(`${transferFrom} -> ${transferTo} [ ${transferAsset} ] transfer`, async () => {
          const result = await getCalldata(wallet, chain, route);
          if (calldata) {
            expect(result.data).toStrictEqual(calldata);
          } else {
            const routeInfo = outdent`
              Route: ${chain.name} -> ${destination.chain.name} [ ${source.asset.originSymbol} ]
              Call: ${result.data}
              Status: Unknown. Queued for processing. \n
            `;
            console.info(routeInfo);
          }
          report.set(key, result.data);
        });
      }
    }
  });
});
