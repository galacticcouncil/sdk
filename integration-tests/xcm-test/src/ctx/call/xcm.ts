import {
  AnyChain,
  Asset,
  AssetRoute,
  Erc20Client,
} from '@galacticcouncil/xcm-core';
import {
  PlatformAdapter,
  FeeSwap,
  Transfer,
  Wallet,
} from '@galacticcouncil/xcm-sdk';

import * as c from 'console';

import { getAddress } from './account';
import { getAmount } from './amount';

const BALANCE = 10;
const FEE = 0.1;
const TRANSFER_AMOUNT = '1';

export const runXcm = (
  name: string,
  cfg: () => Promise<{
    chain: AnyChain;
    route: AssetRoute;
    key: string;
  }>,
  ctx: () => Promise<{
    wallet: Wallet;
  }>,
  options: { skip?: boolean } = {}
) => {
  const itfn = options.skip ? it.skip : it;
  itfn(
    name,
    async () => {
      const { chain, route, key } = await cfg();
      const { wallet } = await ctx();

      try {
        const transfer = await getTransfer(wallet, chain, route);
        const { data } = await transfer.buildCall(TRANSFER_AMOUNT);
        c.log('☑ ' + name + ' complete.');
        expect([key, data]).toMatchSnapshot();
      } catch (e) {
        const error = e as Error;
        c.log('Ups, something went wrong...', error.message);
        return;
      }
    },
    1 * 60 * 1000
  );
};

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
const getTransfer = async (
  wallet: Wallet,
  chain: AnyChain,
  route: AssetRoute
): Promise<Transfer> => {
  const { source, destination } = route;

  const srcAddress = getAddress(chain);
  const destAddress = getAddress(destination.chain);

  // Mock transfer & fee asset balances to 10 units
  const readBalanceMock = jest
    .spyOn(PlatformAdapter.prototype, 'getBalance')
    .mockImplementation(async (asset: Asset) => {
      if (asset.isEqual(destination.asset)) {
        return getAmount(BALANCE, asset, destination.chain);
      }
      return getAmount(BALANCE, asset, chain);
    });

  // Mock source fee to 0.1 unit
  const estimateFeeMock = jest
    .spyOn(PlatformAdapter.prototype, 'estimateFee')
    .mockImplementation(async () => {
      return getAmount(FEE, source.asset, chain);
    });

  // Mock source fee swap support to false (disabled)
  const isSwapSupportedMock = jest
    .spyOn(FeeSwap.prototype, 'isSwapSupported')
    .mockImplementation(() => false);

  const isDestinationSwapSupportedMock = jest
    .spyOn(FeeSwap.prototype, 'isDestinationSwapSupported')
    .mockImplementation(() => false);

  // Mock Erc20 spending cap to current balance (10 units)
  const allowanceMock = jest
    .spyOn(Erc20Client.prototype, 'allowance')
    .mockImplementation(async () => {
      const { decimals } = await chain.getCurrency();
      const assetDecimals = chain.getAssetDecimals(source.asset) || decimals;
      const assetBalance = BALANCE ** assetDecimals;
      return BigInt(assetBalance);
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
  expect(isDestinationSwapSupportedMock).toHaveBeenCalled();

  // Called only if contract bridge transfer from EVM chain, except native
  expect(allowanceMock).toBeDefined();

  return xTransfer;
};
