import {
  AnyChain,
  AssetRoute,
  CallType,
  Parachain,
} from '@galacticcouncil/xcm-core';
import {
  FeeSwap,
  PlatformAdapter,
  Transfer,
  Wallet,
} from '@galacticcouncil/xcm-sdk';

import * as c from 'console';

import { getAccount } from './account';
import { getAmount } from './amount';
import { SetupCtx } from './types';

const TRANSFER_AMOUNT = '10';
const TRANSFER_BTC_AMOUNT = '0.01';

export const runXcmDryRun = (
  name: string,
  cfg: () => Promise<{
    chain: AnyChain;
    route: AssetRoute;
    key: string;
  }>,
  ctx: () => Promise<{
    report: Map<any, any>;
    networks: SetupCtx[];
    wallet: Wallet;
  }>,
  options: { skip?: boolean; sync?: boolean; snapshot?: boolean } = {}
) => {
  const itfn = options.skip ? it.skip : it;

  itfn(
    name,
    async () => {
      const { chain, route, key } = await cfg();
      const { report, networks, wallet } = await ctx();

      const srcChain = chain as Parachain;
      const srcNetwork = networks.find((n) => n.config.key === srcChain.key)!;
      const destChain = route.destination.chain as Parachain;
      const destNetwork = networks.find((n) => n.config.key === destChain.key)!;

      c.log('\n🥢 Executing ' + name + ' ...');
      c.log('🥢 Route key: ' + key);

      const transfer = await getTransfer(
        wallet,
        srcNetwork,
        destNetwork,
        route
      );

      const isBtcDerivate = route.source.asset.key
        .toUpperCase()
        .includes('BTC');

      const amount = isBtcDerivate ? TRANSFER_BTC_AMOUNT : TRANSFER_AMOUNT;
      const calldata = await transfer.buildCall(amount);

      let extrinsic;
      if (calldata.type === CallType.Evm && chain.key === 'moonbeam') {
        throw Error('Evm is not supported yet');
      } else {
        extrinsic = srcNetwork.api.tx(calldata.data);
      }

      c.log('🥢 Extrinsic: ', extrinsic.toHex());
      const result = await calldata.dryRun();
      if (result) {
        const { events, ...rest } = result;
        if (result.error) {
          c.log('🥢 ' + name + ' ❌', result.error);
        } else {
          c.log('🥢 ' + name + ' ✅');
        }
        report.set(key, rest);
      } else {
        c.log('🥢 ' + name + ' not supported.');
      }
      c.log('🥢 ' + name + ' complete.');
    },
    2 * 60 * 1000
  );
};

const getTransfer = async (
  wallet: Wallet,
  srcNetwork: SetupCtx,
  destNetwork: SetupCtx,
  route: AssetRoute
): Promise<Transfer> => {
  const { source } = route;

  const srcChain = srcNetwork.config;
  const srcAccount = getAccount(srcChain);
  const srcApiMock = jest
    .spyOn(srcChain, 'api', 'get')
    .mockImplementation(async () => srcNetwork.api);

  const destChain = destNetwork.config;
  const destAccount = getAccount(destChain);
  const destApiMock = jest
    .spyOn(destNetwork.config, 'api', 'get')
    .mockImplementation(async () => destNetwork.api);

  if (route.contract) {
    jest
      .spyOn(PlatformAdapter.prototype, 'estimateFee')
      .mockImplementation(async () => {
        return getAmount(0.1, source.asset, 18);
      });
  }

  const isSwapSupportedMock = jest
    .spyOn(FeeSwap.prototype, 'isSwapSupported')
    .mockImplementation(() => false);

  const isDestinationSwapSupportedMock = jest
    .spyOn(FeeSwap.prototype, 'isDestinationSwapSupported')
    .mockImplementation(() => false);

  const xTransfer = await wallet.transfer(
    source.asset,
    srcAccount.address,
    srcChain,
    destAccount.address,
    destChain
  );

  expect(srcApiMock).toHaveBeenCalled();
  expect(destApiMock).toHaveBeenCalled();
  expect(isSwapSupportedMock).toHaveBeenCalled();
  expect(isDestinationSwapSupportedMock).toHaveBeenCalled();

  return xTransfer;
};
