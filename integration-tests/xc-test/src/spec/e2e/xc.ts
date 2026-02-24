import {
  multiloc,
  AnyChain,
  Asset,
  AssetRoute,
  CallType,
  Erc20Client,
  EvmClient,
  Parachain,
} from '@galacticcouncil/xc-core';
import {
  FeeSwap,
  PlatformAdapter,
  Transfer,
  TransferBuilder,
  Wallet,
} from '@galacticcouncil/xc-sdk';
import { clients } from '@galacticcouncil/xc-cfg';
import { big } from '@galacticcouncil/common';

import { jest } from '@jest/globals';
import { Binary } from 'polkadot-api';

import * as c from 'console';

import { aliceSigner, getAddress } from './account';
import { checkIfProcessed, logEvents } from './events';
import { SetupCtx } from './types';

const { BaseClient, AssethubClient } = clients;

const BALANCE = 100;
const FEE = 0.1;
const TRANSFER_AMOUNT = '10';
const TRANSFER_BTC_AMOUNT = '0.001';

export const runXc = (
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
  const shouldSync = options.sync || false;
  const shouldSnapshot = options.snapshot || false;

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

      const transfer = await getTransfer(wallet, chain, route);

      const isBtcDerivate = route.source.asset.key
        .toUpperCase()
        .includes('BTC');

      const amount = isBtcDerivate ? TRANSFER_BTC_AMOUNT : TRANSFER_AMOUNT;
      const calldata = await transfer.buildCall(amount);

      if (calldata.type === CallType.Evm) {
        c.log('🥢 ' + name + ' skipped (EVM).');
        return;
      }

      c.log('🥢 Calldata: ', calldata.data.substring(0, 66) + '...');

      // Create transaction from encoded calldata via papi
      const api = srcNetwork.client.getUnsafeApi();
      const tx = await api.txFromCallData(Binary.fromHex(calldata.data));

      // Sign the transaction (returns hex-encoded signed extrinsic)
      const signedHex = await tx.sign(aliceSigner);

      // Submit to Chopsticks tx pool via legacy RPC
      await srcNetwork.client._request('author_submitExtrinsic', [signedHex]);

      // Create block using chopsticks chain object directly
      const srcBlock = await srcNetwork.chain.newBlock();
      c.log('🥢 Source block:', srcBlock.hash);
      const srcEvents = await api.query.System.Events.getValue();
      logEvents(srcEvents);
      const srcFailures = srcEvents
        .filter(
          ({ event }: any) =>
            event.type === 'System' && event.value?.type === 'ExtrinsicFailed'
        )
        .map(({ event }: any) => event.value);
      expect(srcFailures).toEqual([]);

      // Advance relay chain to forward UMP/DMP messages
      const relayNetwork = networks.find((n) => n.config.parachainId === 0);
      if (relayNetwork) {
        await relayNetwork.chain.newBlock();
      }

      await srcNetwork.chain.newBlock();

      // If transfer goes via a reserve chain, advance that too
      const assetReserve = getAssetReserve(srcChain, route);
      if (Number.isFinite(assetReserve)) {
        const reserveNetwork = networks.find(
          (n) => n.config.parachainId === assetReserve
        );
        if (
          reserveNetwork &&
          isViaReserve(srcChain, destChain, reserveNetwork.config)
        ) {
          await reserveNetwork.chain.newBlock();
          const reserveApi = reserveNetwork.client.getUnsafeApi();
          let reserveEvents = await reserveApi.query.System.Events.getValue();

          // Sometimes needs a second block to forward queued messages
          if (!checkIfProcessed(reserveEvents)) {
            await reserveNetwork.chain.newBlock();
            reserveEvents = await reserveApi.query.System.Events.getValue();
          }

          logEvents(reserveEvents);
        }
      }

      // Advance destination block to process incoming XCM
      await destNetwork.chain.newBlock();
      const destApi = destNetwork.client.getUnsafeApi();
      let destEvents = await destApi.query.System.Events.getValue();

      // Sometimes needs a second block to process queued messages
      if (!checkIfProcessed(destEvents)) {
        await destNetwork.chain.newBlock();
        destEvents = await destApi.query.System.Events.getValue();
      }

      logEvents(destEvents);
      expect(checkIfProcessed(destEvents)).toBeTruthy();

      shouldSnapshot && expect([key, calldata.data]).toMatchSnapshot();

      // Read post-transfer balances
      const postTransfer = await getTransfer(wallet, chain, route);

      const destinationFee = getDestinationFee(amount, transfer, postTransfer);

      shouldSync &&
        report.set(key, {
          updated: Date.now(),
          destination: {
            fee: destinationFee.delta,
            feeAsset: destinationFee.asset,
            feeNative: destinationFee.deltaBn.toString(),
          },
        });

      c.table(
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
      c.log('🥢 ' + name + ' complete.');
    },
    2 * 60 * 1000
  );
};

const ASSET_HUB_ID = 1000;

const isAssetHubReserve = (location: Record<string, any>): boolean => {
  const { parents, interior } = location;
  if (parents === 1 && interior === 'Here') return true;
  if (parents === 2 && interior && interior !== 'Here') {
    const junctions = Object.values(interior).flat();
    return junctions.some(
      (j: any) => j && typeof j === 'object' && 'GlobalConsensus' in j
    );
  }
  return false;
};

export const getAssetReserve = (
  chain: Parachain,
  route: AssetRoute
): number | undefined => {
  const location = chain.getAssetXcmLocation(route.source.asset);
  if (location) {
    if (isAssetHubReserve(location)) return ASSET_HUB_ID;
    return multiloc.findParachain(location);
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

/**
 * Build Transfer reading real chain balances from Chopsticks.
 * Only fees, swaps & EVM are mocked; balance queries hit real state.
 */
const getTransfer = async (
  wallet: Wallet,
  chain: AnyChain,
  route: AssetRoute
): Promise<Transfer> => {
  const { source, destination } = route;

  const srcAddress = getAddress(chain);
  const destAddress = getAddress(destination.chain);

  const getAmount = async (amount: number, asset: Asset, c: AnyChain) => {
    const { AssetAmount } = await import('@galacticcouncil/xc-core');
    const { decimals } = await c.getCurrency();
    const assetDecimals = c.getAssetDecimals(asset) || decimals;
    const assetAmount = amount * 10 ** assetDecimals;
    return AssetAmount.fromAsset(asset, {
      decimals: assetDecimals,
      amount: BigInt(assetAmount),
    });
  };

  // Mock fee estimation
  jest
    .spyOn(PlatformAdapter.prototype, 'estimateFee')
    .mockImplementation(async () => {
      return getAmount(FEE, source.asset, chain);
    });

  // Mock fee swaps as disabled
  jest
    .spyOn(FeeSwap.prototype, 'isSwapSupported')
    .mockImplementation(() => false);

  jest
    .spyOn(FeeSwap.prototype, 'isDestinationSwapSupported')
    .mockImplementation(() => false);

  // Mock destination fee builders
  jest
    .spyOn(BaseClient.prototype, 'calculateDestinationFee')
    .mockImplementation(async () => 1_000_000_000n);
  jest
    .spyOn(AssethubClient.prototype, 'calculateDeliveryFee')
    .mockImplementation(async () => 500_000_000n);
  jest
    .spyOn(AssethubClient.prototype, 'getBridgeDeliveryFee')
    .mockImplementation(async () => 2_750_872_500_000n);

  // Mock EVM provider
  jest.spyOn(EvmClient.prototype, 'getProvider').mockImplementation(
    () =>
      ({
        readContract: async (params: any) => {
          if (params.functionName === 'decimals') {
            return 18;
          }
          return 100_000_000_000_000n;
        },
      }) as any
  );

  // Mock Erc20 allowance
  jest
    .spyOn(Erc20Client.prototype, 'allowance')
    .mockImplementation(async () => {
      const { decimals } = await chain.getCurrency();
      const assetDecimals = chain.getAssetDecimals(source.asset) || decimals;
      return BigInt(BALANCE * 10 ** assetDecimals);
    });

  try {
    const xTransfer = await TransferBuilder(wallet)
      .withAsset(source.asset)
      .withSource(chain)
      .withDestination(destination.chain)
      .build({ srcAddress, dstAddress: destAddress });

    return xTransfer;
  } finally {
    jest.restoreAllMocks();
  }
};

const isSufficientAssetTransfer = (transfer: Transfer): boolean => {
  return transfer.source.balance.isSame(transfer.source.destinationFee);
};

const getSourceBalanceDiff = (before: Transfer, after: Transfer) => {
  const balance = before.source.balance;
  const balanceAfter = after.source.balance;
  const delta = balance.amount - balanceAfter.amount;
  return {
    asset: balance.originSymbol,
    delta: '-' + big.toDecimal(delta, balance.decimals),
    deltaBn: delta,
  };
};

const getDestinationBalanceDiff = (before: Transfer, after: Transfer) => {
  const balance = before.destination.balance;
  const balanceAfter = after.destination.balance;
  const delta = balanceAfter.amount - balance.amount;
  return {
    asset: balance.originSymbol,
    delta: '+' + big.toDecimal(delta, balance.decimals),
    deltaBn: delta,
  };
};

const getDestinationFee = (
  amount: string,
  before: Transfer,
  after: Transfer
) => {
  const isSufficient = isSufficientAssetTransfer(before);

  if (isSufficient) {
    const balance = before.destination.balance;
    const balanceAfter = after.destination.balance;
    const transfered = big.toBigInt(amount, balance.decimals);
    const delta = transfered - (balanceAfter.amount - balance.amount);
    const deltaFmt = big.toDecimal(delta, balance.decimals);
    return { asset: balance.originSymbol, delta: deltaFmt, deltaBn: delta };
  }

  const balance = before.source.destinationFeeBalance;
  const balanceAfter = after.source.destinationFeeBalance;
  const delta = balance.amount - balanceAfter.amount;
  const deltaFmt = big.toDecimal(delta, balance.decimals);
  return { asset: balance.originSymbol, delta: deltaFmt, deltaBn: delta };
};

const tableRow = (
  title: string,
  info: { asset: string; delta: string; deltaBn: bigint }
) => {
  return { name: title, ...info };
};
