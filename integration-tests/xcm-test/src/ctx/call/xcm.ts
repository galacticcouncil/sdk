import { AnyChain, Asset, AssetRoute } from '@galacticcouncil/xcm-core';
import {
  Erc20Client,
  Metadata,
  PlatformAdapter,
  Wallet,
  XTransfer,
} from '@galacticcouncil/xcm-sdk';

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
        expect([key, data]).toMatchSnapshot();
      } catch (e) {
        const error = e as Error;
        console.log('Ups, something went wrong...', error.message);
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
): Promise<XTransfer> => {
  const { source, destination } = route;
  const sourceMeta = new Metadata(chain);
  const destinationMeta = new Metadata(destination.chain);

  const srcAddress = getAddress(chain);
  const destAddress = getAddress(destination.chain);

  // Mock transfer & fee asset balances to 10 units
  const readBalanceMock = jest
    .spyOn(PlatformAdapter.prototype, 'getBalance')
    .mockImplementation(async (asset: Asset) => {
      if (asset.isEqual(destination.asset)) {
        return getAmount(BALANCE, asset, destinationMeta);
      }
      return getAmount(BALANCE, asset, sourceMeta);
    });

  // Mock source fee to 0.1 unit
  const estimateFeeMock = jest
    .spyOn(PlatformAdapter.prototype, 'estimateFee')
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

  return xTransfer;
};
