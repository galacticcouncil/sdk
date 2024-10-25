import { writeFileSync } from 'fs';

import {
  AnyChain,
  Asset,
  AssetRoute,
  ChainEcosystem,
  ChainRoutes,
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
import { buildAmount } from './utils';

import hydration from './data/hydration.json';

import snp from './data/snapshot.json';

interface Snapshot {
  [key: string]: any;
}

const SNAPSHOTS: Snapshot = {
  hydration: hydration,
};

const jestConsole = console;

const BALANCE = 10;
const FEE = 0.1;
const FEE_BALANCE = 1;

const testCase = async (
  wallet: Wallet,
  snapshot: any,
  chainKey: string,
  sender: string
) => {
  const config = wallet.config.getChainRoutes(chainKey);
  const { chain, routes } = config;

  const result = new Map();
  const snaps = new Map(Object.entries(snapshot));

  for (const [key, route] of routes.entries()) {
    const { source, destination } = route;
    const sourceMeta = new Metadata(chain);
    const destinationMeta = new Metadata(destination.chain);

    const getBalanceMock = jest
      .spyOn(TransferService.prototype, 'getBalance')
      .mockImplementation(async (address) => {
        if (address === sender) {
          return buildAmount(BALANCE, source.asset, sourceMeta);
        }
        return buildAmount(BALANCE, destination.asset, destinationMeta);
      });

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
                    address: sender,
                  })
                  .call()
              : feeAsset;
          return buildAmount(FEE, asset, sourceMeta);
        }
        return buildAmount(FEE, source.asset, sourceMeta);
      });

    const getDestinationFeeBalanceMock = jest
      .spyOn(TransferService.prototype, 'getDestinationFeeBalance')
      .mockImplementation(async () => {
        return buildAmount(FEE_BALANCE, destination.fee.asset, destinationMeta);
      });

    const getDestinationFeeMock = jest
      .spyOn(TransferService.prototype, 'getDestinationFee')
      .mockImplementation(async () => {
        return buildAmount(FEE, destination.fee.asset, destinationMeta);
      });

    const getFeeMock = jest
      .spyOn(TransferService.prototype, 'getFee')
      .mockImplementation(async () => {
        return buildAmount(FEE, source.asset, sourceMeta);
      });

    const isSwapSupportedMock = jest
      .spyOn(wallet.dex, 'isSwapSupported')
      .mockImplementation(() => false);

    const xTransfer = await wallet.transfer(
      source.asset,
      sender,
      chain,
      destination.chain.isEvm()
        ? '0x0000000000000000000000000000000000000000'
        : sender,
      destination.chain
    );

    expect(getBalanceMock).toHaveBeenCalled();
    expect(getFeeBalanceMock).toHaveBeenCalled();
    expect(getDestinationFeeBalanceMock).toHaveBeenCalled();
    expect(getDestinationFeeMock).toHaveBeenCalled();
    expect(getFeeMock).toHaveBeenCalled();
    expect(isSwapSupportedMock).toHaveBeenCalled();

    getBalanceMock.mockClear();
    getFeeBalanceMock.mockClear();
    getDestinationFeeBalanceMock.mockClear();
    getDestinationFeeMock.mockClear();
    getFeeMock.mockClear();
    isSwapSupportedMock.mockClear();

    const calldata = await xTransfer.buildCall('1');

    const data = snaps.get(key);
    if (data) {
      // Fail fast if snapshot mismatch
      expect(calldata.data).toStrictEqual(data);
      const message = outdent`
        Route: ${chain.name} -> ${destination.chain.name} [ ${source.asset.originSymbol} ]
        Call: ${calldata.data}
        Status: ✅ \n
      `;
      console.log(message);
    } else {
      const message = outdent`
        Route: ${chain.name} -> ${destination.chain.name} [ ${source.asset.originSymbol} ]
        Call: ${calldata.data}
        Status: ❗ Unknown transfer. Queued for processing. \n
      `;
      console.log(message);
    }
    result.set(key, calldata.data);
  }
  const json = JSON.stringify(Object.fromEntries(result), null, 2);
  const file = ['./src/data/', chainKey, '.json'].join('');
  writeFileSync(file, json);
};

const fullAddressSpace = (chain: AnyChain): boolean => {
  return (
    chain instanceof Parachain &&
    chain.isEvmParachain() &&
    chain.usesH160Acc == false
  );
};

const h160AddressSpaceOnly = (chain: AnyChain): boolean => {
  return (
    (chain instanceof Parachain && chain.usesH160Acc == true) ||
    chain.isEvmChain()
  );
};

const getAddress = (chain: AnyChain): string => {
  if (fullAddressSpace(chain)) {
    return '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  }

  if (h160AddressSpaceOnly(chain)) {
    return '0x0000000000000000000000000000000000000000';
  }

  return '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
};

const buildKey = (chain: AnyChain, route: AssetRoute) => {
  const { source, destination } = route;
  return [chain.key, destination.chain.key, source.asset.key].join('-');
};

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
      buildAmount(BALANCE, source.asset, sourceMeta)
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
        return buildAmount(FEE, asset, sourceMeta);
      }
      return buildAmount(FEE, source.asset, sourceMeta);
    });

  const getDestinationFeeBalanceMock = jest
    .spyOn(TransferService.prototype, 'getDestinationFeeBalance')
    .mockImplementation(async () => {
      return buildAmount(FEE_BALANCE, destination.fee.asset, destinationMeta);
    });

  const getDestinationFeeMock = jest
    .spyOn(TransferService.prototype, 'getDestinationFee')
    .mockImplementation(async () => {
      return buildAmount(FEE, destination.fee.asset, destinationMeta);
    });

  const getFeeMock = jest
    .spyOn(TransferService.prototype, 'getFee')
    .mockImplementation(async () => {
      return buildAmount(FEE, source.asset, sourceMeta);
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
  jest.setTimeout(2 * 60 * 1000); // Execution time 2min

  let wallet: Wallet;

  const snapshot = new Map(Object.entries(snp));
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
      // Init snapshot from report
      const json = JSON.stringify(Object.fromEntries(report), null, 2);
      const file = ['./src/data/snapshot.json'].join('');
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

        const key = buildKey(chain, route);
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
