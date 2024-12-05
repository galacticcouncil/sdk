import { sendTransaction } from '@acala-network/chopsticks-testing';
import {
  multiloc,
  AnyChain,
  AssetRoute,
  CallType,
  Parachain,
} from '@galacticcouncil/xcm-core';
import {
  TransferAdapter,
  Wallet,
  XCallEvm,
  XTransfer,
} from '@galacticcouncil/xcm-sdk';

import { getAccount } from './account';
import { getAmount } from './amount';
import { checkIfFailed, checkIfProcessed, checkIfSent } from './events';
import { moonbeam } from './hooks';
import {
  getSourceBalanceDiff,
  getDestinationBalanceDiff,
  getDestinationFee,
} from './xcm.utils';
import { SetupCtx } from './types';

import { getRouteKey } from '../../utils/route';

const TRANSFER_AMOUNT = '10';

export const runXcm = (
  name: string,
  cfg: () => Promise<{
    chain: AnyChain;
    route: AssetRoute;
  }>,
  ctx: () => Promise<{
    report: Map<any, any>;
    networks: SetupCtx[];
    wallet: Wallet;
  }>,
  options: { skip?: boolean; sync?: boolean; snapshot?: boolean } = {}
) => {
  const itfn = options.skip ? it.skip : it;
  const shouldSync = options.sync || false;
  const shouldSnapshot = options.snapshot || false;

  itfn(
    name,
    async () => {
      const { chain, route } = await cfg();
      const { report, networks, wallet } = await ctx();

      const srcChain = chain as Parachain;
      const srcNetwork = networks.find((n) => n.config.key === srcChain.key)!;
      const destChain = route.destination.chain as Parachain;
      const destNetwork = networks.find((n) => n.config.key === destChain.key)!;

      const key = getRouteKey(chain, route);

      console.log('\n🥢 Executing ' + name + ' ...');
      console.log('🥢 Route key: ' + key);

      const transfer = await getTransfer(
        wallet,
        srcNetwork,
        destNetwork,
        route
      );

      const calldata = await transfer.buildCall(TRANSFER_AMOUNT);

      let extrinsic;
      if (calldata.type === CallType.Evm && chain.key === 'moonbeam') {
        return;
        // Skipped for now
        extrinsic = moonbeam.toTransferExtrinsic(
          srcNetwork.api,
          calldata as XCallEvm
        );
      } else {
        extrinsic = srcNetwork.api.tx(calldata.data);
      }

      const srcAccount = getAccount(srcChain);
      await sendTransaction(extrinsic.signAsync(srcAccount));

      await srcNetwork.chain.newBlock();
      const srcEvents = await srcNetwork.api.query.system.events();
      expect(checkIfFailed(srcNetwork.api, srcEvents)).toBeFalsy();
      checkIfSent(srcEvents);

      const assetReserve = getAssetReserve(srcChain, route);
      if (Number.isFinite(assetReserve)) {
        const reserveNetwork = networks.find(
          (n) => n.config.parachainId === assetReserve
        )!;
        if (isViaReserve(srcChain, destChain, reserveNetwork.config)) {
          await reserveNetwork.chain.newBlock();
          const reserveEvents = await reserveNetwork.api.query.system.events();
          checkIfProcessed(reserveEvents);
        }
      }

      await destNetwork.chain.newBlock();
      const destEvents = await destNetwork.api.query.system.events();
      expect(checkIfProcessed(destEvents)).toBeTruthy();

      shouldSnapshot && expect([key, calldata.data]).toMatchSnapshot();

      const postTransfer = await getTransfer(
        wallet,
        srcNetwork,
        destNetwork,
        route
      );

      const destinationFee = getDestinationFee(
        TRANSFER_AMOUNT,
        transfer,
        postTransfer
      );

      shouldSync &&
        report.set(key, {
          updated: Date.now(),
          destination: {
            fee: destinationFee.delta,
            feeAsset: destinationFee.asset,
            feeNative: destinationFee.deltaBn,
          },
        });

      console.table(
        [
          tableRow(
            'Balance (Source)',
            getSourceBalanceDiff(transfer, postTransfer)
          ),
          tableRow(
            'Balance (Destination)',
            getDestinationBalanceDiff(transfer, postTransfer)
          ),
          tableRow('Fee', destinationFee),
        ],
        ['name', 'asset', 'delta']
      );
      console.log('🥢 ' + name + ' complete.');
    },
    2 * 60 * 1000
  );
};

const getAssetReserve = (
  chain: Parachain,
  route: AssetRoute
): number | undefined => {
  if (route.source.asset.key === 'dot') {
    return 0;
  }

  const location = chain.getAssetXcmLocation(route.source.asset);
  if (location) {
    const parachainEntry = multiloc.findNestedKey(location, 'Parachain');
    const parachain = parachainEntry && parachainEntry['Parachain'];
    return Number(parachain);
  }
  return undefined;
};

const isViaReserve = (
  srcChain: Parachain,
  destChain: Parachain,
  reserve: Parachain
): boolean => {
  return srcChain.key !== reserve.key && destChain.key !== reserve.key;
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

  if (route.contract) {
    jest
      .spyOn(TransferAdapter.prototype, 'estimateFee')
      .mockImplementation(async () => {
        return getAmount(0.1, source.asset, 18);
      });
  }

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

const tableRow = (
  title: string,
  info: {
    asset: string;
    delta: string;
    deltaBn: bigint;
  }
) => {
  return {
    name: title,
    ...info,
  };
};
