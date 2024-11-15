import { sendTransaction } from '@acala-network/chopsticks-testing';
import {
  AnyChain,
  AssetAmount,
  AssetRoute,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { Wallet, XTransfer } from '@galacticcouncil/xcm-sdk';

import { getAccount } from './account';
import { checkSystemEvents } from './matchers';
import { SetupCtx } from './types';

import { getRouteKey } from '../utils';

export const runXcm = (
  name: string,
  cfg: () => Promise<{
    chain: AnyChain;
    route: AssetRoute;
  }>,
  ctx: () => Promise<{
    networks: SetupCtx[];
    wallet: Wallet;
  }>,
  options: { skip?: boolean } = {}
) => {
  const itfn = options.skip ? it.skip : it;
  itfn(
    name,
    async () => {
      const { chain, route } = await cfg();
      const { networks, wallet } = await ctx();

      const srcChain = chain as Parachain;
      const srcNetwork = networks.find((n) => n.config.key === srcChain.key)!;
      const destChain = route.destination.chain as Parachain;
      const destNetwork = networks.find((n) => n.config.key === destChain.key)!;

      const key = getRouteKey(chain, route);

      console.log('\n🥢 Executing ' + name);
      console.log('🥢 Route key: ' + key);

      const transfer = await getTransfer(
        wallet,
        srcNetwork,
        destNetwork,
        route
      );

      const { data } = await transfer.buildCall('10');
      const extrinsic = srcNetwork.api.tx(data);

      const srcAccount = getAccount(srcChain);
      await sendTransaction(extrinsic.signAsync(srcAccount));

      await srcNetwork.chain.newBlock();
      await checkSystemEvents(srcNetwork, 'xcmpQueue').toMatchSnapshot(
        'xcmpQueue'
      );

      if (isMoonbeamReserve(srcChain, route)) {
        const moonbeam = networks.find((n) => n.config.key === 'moonbeam')!;
        await moonbeam.chain.newBlock();
      }

      if (isDotReserve(srcChain, route)) {
        const relay = networks.find((n) => n.config.key === 'polkadot')!;
        await relay.chain.newBlock();
      }

      await destNetwork.chain.newBlock();
      await checkSystemEvents(
        destNetwork,
        'xcmpQueue',
        'messageQueue'
      ).toMatchSnapshot('messageQueue');

      const after = await getTransfer(wallet, srcNetwork, destNetwork, route);
      getTransferTable(transfer, after);
      console.log('🥢 DONE: ' + name);
    },
    240000
  );
};

const isMoonbeamReserve = (chain: Parachain, route: AssetRoute): boolean => {
  return (
    chain.key !== 'moonbeam' &&
    route.destination.chain.key !== 'moonbeam' &&
    (route.source.asset.key === 'glmr' ||
      route.source.asset.key.endsWith('_mwh'))
  );
};

const isDotReserve = (chain: Parachain, route: AssetRoute): boolean => {
  return (
    chain.key !== 'polkadot' &&
    route.destination.chain.key !== 'polkadot' &&
    route.source.asset.key === 'dot'
  );
};

const getTransfer = async (
  wallet: Wallet,
  srcNetwork: SetupCtx,
  destNetwork: SetupCtx,
  route: AssetRoute
): Promise<XTransfer> => {
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

  const isSwapSupportedMock = jest
    .spyOn(wallet.dex, 'isSwapSupported')
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

  return xTransfer;
};

const getTransferTable = (before: XTransfer, after: XTransfer) => {
  const isSufficientAssetTransfer = before.source.balance.isSame(
    before.source.destinationFee
  );

  const balance = getTransferTableRow(
    'Balance',
    before.source.balance,
    after.source.balance
  );

  const balanceDest = getTransferTableRow(
    'Balance (Destination)',
    before.destination.balance,
    after.destination.balance
  );

  const report = [balance, balanceDest];

  if (!isSufficientAssetTransfer) {
    const fee = getTransferTableRow(
      'Fee',
      before.source.destinationFeeBalance,
      after.source.destinationFeeBalance
    );
    report.push(fee);
  }

  console.table(report);
};

const getTransferTableRow = (
  title: string,
  before: AssetAmount,
  after: AssetAmount
) => {
  const beforeFtm = before.toDecimal(before.decimals);
  const afterFmt = after.toDecimal(after.decimals);
  const delta = Number(beforeFtm) - Number(afterFmt);

  return {
    name: title,
    asset: before.originSymbol,
    before: beforeFtm,
    after: afterFmt,
    delta: delta < 0 ? '+' + Math.abs(delta) : '-' + delta,
  };
};
