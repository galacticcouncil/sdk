import {
  Abi,
  EvmChain,
  FeeAmount,
  FeeAmountConfigBuilder,
  Parachain,
  Snowbridge as Sb,
  Wormhole as Wh,
  Basejump as Bj,
} from '@galacticcouncil/xc-core';

import {
  BRIDGE_HUB_ID,
  ETHEREUM_CHAIN_ID,
  buildERC20TransferFromPara,
  buildParaERC20Received,
  buildParaERC20ReceivedV5,
  buildReserveTransfer,
  buildNestedReserveTransfer,
  buildMultiHopReserveTransfer,
  buildSnowbridgeInboundDryRunXcm,
  buildSnowbridgeOutboundXcm,
  etherLocation,
  TOPIC,
} from './extrinsics/xcm';
import { validateReserveChain } from './extrinsics/xcm/utils';
import { padFeeByPercentage } from './utils';

import { dot } from '../assets';
import {
  ASSETHUB_ETHER_ED,
  SNOWBRIDGE_BASE_DISPATCH_GAS,
  SNOWBRIDGE_BASE_VERIFICATION_GAS,
  SNOWBRIDGE_TOKEN_DELIVERY_GAS,
  SNOWBRIDGE_SUBMIT_GAS,
} from '../bridges/snowbridge';
import { BaseClient, AssethubClient, HydrationClient } from '../clients';

function TokenRelayer() {
  return {
    calculateRelayerFee: (): FeeAmountConfigBuilder => ({
      build: async ({ feeAsset, destination, source }) => {
        const ctx = source as EvmChain;
        const rcv = destination as EvmChain;

        const ctxWh = Wh.fromChain(ctx);
        const rcvWh = Wh.fromChain(rcv);

        const feeAssetId = ctx.getAssetId(feeAsset);
        const feeAssetDecimals = ctx.getAssetDecimals(feeAsset);
        const relayerFee = await ctx.evmClient.getProvider().readContract({
          abi: Abi.TokenRelayer,
          address: ctxWh.getTokenRelayer() as `0x${string}`,
          args: [
            rcvWh.getWormholeId(),
            feeAssetId as `0x${string}`,
            feeAssetDecimals,
          ],
          functionName: 'calculateRelayerFee',
        });
        return { amount: relayerFee } as FeeAmount;
      },
    }),
  };
}

function Wormhole() {
  return {
    TokenRelayer,
  };
}

type SendFeeOpts = {
  hub: Parachain;
};

function Snowbridge() {
  return {
    calculateInboundFee: (opts: SendFeeOpts): FeeAmountConfigBuilder => ({
      build: async ({ feeAsset, destination }) => {
        const rcv = destination as Parachain;

        const paraClient = new HydrationClient(rcv);
        const hubClient = new AssethubClient(opts.hub);

        const xcm = buildParaERC20Received(feeAsset, rcv);
        const xcmV5 = buildParaERC20ReceivedV5(feeAsset, rcv);
        const etherLoc = etherLocation(ETHEREUM_CHAIN_ID);

        // Hardcoded BridgeHub extrinsic fee
        const extrinsicFeeDot = 250_000_000n;

        // Comprehensive dummy of what AH actually executes: BridgeHub's
        // prelude (ReserveAssetDeposited + ExchangeAsset + PayFees) plus our
        // user XCM.
        const dummyInboundXcm = buildSnowbridgeInboundDryRunXcm(
          ETHEREUM_CHAIN_ID,
          rcv.parachainId
        );

        // 1. Query DOT-denominated fees.
        const [
          destinationExecutionFeeDot,
          destinationDeliveryFeeDot,
          assetHubDeliveryFeeDot,
          assetHubExecutionFeeDotRaw,
        ] = await Promise.all([
          paraClient.calculateDestinationFeeV5(xcmV5, dot),
          hubClient.calculateDeliveryFee(xcm, rcv.parachainId),
          hubClient.calculateDeliveryFee(xcm, BRIDGE_HUB_ID),
          hubClient.calculateDestinationFeeV5(dummyInboundXcm, dot),
        ]);

        const paddedDestExecutionDot = padFeeByPercentage(
          destinationExecutionFeeDot,
          33n
        );
        const paddedDestDeliveryDot = padFeeByPercentage(
          destinationDeliveryFeeDot,
          33n
        );
        const paddedAssetHubDeliveryDot = padFeeByPercentage(
          assetHubDeliveryFeeDot,
          33n
        );
        const assetHubExecutionFeeDot = padFeeByPercentage(
          assetHubExecutionFeeDotRaw,
          33n
        );

        // 2. Compute fee
        const ahDotFee = assetHubExecutionFeeDot + paddedDestDeliveryDot;
        const hydrationDotFee = paddedDestExecutionDot;

        // 3a. Ether for BridgeHub's PayFees
        const executionFeeQuoted = await hubClient.quoteEtherForDot(
          etherLoc,
          ahDotFee
        );
        const executionFeePadded = padFeeByPercentage(executionFeeQuoted, 30n);
        const executionFee =
          executionFeePadded < ASSETHUB_ETHER_ED * 2n
            ? ASSETHUB_ETHER_ED * 2n
            : executionFeePadded;

        const remoteEtherFee = padFeeByPercentage(
          await hubClient.quoteEtherForDot(etherLoc, hydrationDotFee),
          100n
        );

        // 4. Relayer fee
        const relayerFee = padFeeByPercentage(
          await hubClient.quoteDotToEther(
            etherLoc,
            extrinsicFeeDot + paddedAssetHubDeliveryDot
          ),
          30n
        );

        // 5. Total wei the user pays.
        const totalFeeInWei = executionFee + relayerFee + remoteEtherFee;

        return {
          amount: totalFeeInWei,
          breakdown: {
            executionFee,
            relayerFee,
            remoteEtherFee,
            hydrationDotFee,
          },
        } as FeeAmount;
      },
    }),
    calculateOutboundFee: (opts: SendFeeOpts): FeeAmountConfigBuilder => ({
      build: async ({ transferAsset, feeAsset, source, destination }) => {
        const ctx = source as Parachain;
        const dest = destination as EvmChain;

        const hubClient = new AssethubClient(opts.hub);
        const etherLoc = etherLocation(ETHEREUM_CHAIN_ID);

        const xcm = buildERC20TransferFromPara(transferAsset, ctx);

        const [
          bridgeDeliveryFee,
          bridgeHubDeliveryFee,
          assetHubDestinationFee,
        ] = await Promise.all([
          hubClient.getBridgeDeliveryFee(),
          hubClient.calculateDeliveryFee(xcm, BRIDGE_HUB_ID),
          hubClient.calculateDestinationFee(xcm, feeAsset),
        ]);

        const gasPrice = await dest.evmClient.getProvider().getGasPrice();
        const totalGas =
          SNOWBRIDGE_SUBMIT_GAS +
          SNOWBRIDGE_BASE_VERIFICATION_GAS +
          SNOWBRIDGE_BASE_DISPATCH_GAS +
          SNOWBRIDGE_TOKEN_DELIVERY_GAS;

        const rawGasFee = gasPrice * totalGas;
        const etherFeeAmount = padFeeByPercentage(rawGasFee, 10n);

        // DOT for AssetHub execution + downstream deliveries (remote_fees)
        const dotRemoteFee =
          bridgeDeliveryFee +
          padFeeByPercentage(bridgeHubDeliveryFee, 33n) +
          padFeeByPercentage(assetHubDestinationFee, 33n);

        const dotToEtherSwapAmount = padFeeByPercentage(
          await hubClient.quoteDotForExactEther(etherLoc, etherFeeAmount),
          20n
        );

        // Query source chain XCM execution fee dynamically
        const sourceClient = new HydrationClient(ctx);
        const dummyOutboundXcm = buildSnowbridgeOutboundXcm({
          tokenAddress: '0x0000000000000000000000000000000000000000',
          senderPubKey: '0x' + '00'.repeat(32),
          beneficiaryHex: '0x' + '00'.repeat(20),
          tokenAmount: 1_000_000_000_000n,
          sourceExecutionFee: 1_000_000_000n,
          dotRemoteFee: 1_000_000_000n,
          dotToEtherSwapAmount: 1_000_000_000n,
          etherFeeAmount: 1_000_000_000n,
          topic: TOPIC,
        });

        const sourceExecutionFee = padFeeByPercentage(
          await sourceClient.calculateDestinationFeeV5(dummyOutboundXcm, dot),
          33n
        );

        const totalDotFee =
          dotRemoteFee + dotToEtherSwapAmount + sourceExecutionFee;

        return {
          amount: totalDotFee,
          breakdown: {
            dotRemoteFee,
            dotToEtherSwapAmount,
            etherFeeAmount,
            sourceExecutionFee,
          },
        } as FeeAmount;
      },
    }),

    calculateInboundFeeV1: (opts: SendFeeOpts): FeeAmountConfigBuilder => ({
      build: async ({ feeAsset, destination, source }) => {
        const ctx = source as EvmChain;
        const rcv = destination as Parachain;

        const ctxSb = Sb.fromChain(ctx);

        const paraClient = new BaseClient(rcv);
        const hubClient = new AssethubClient(opts.hub);

        const xcm = buildParaERC20Received(feeAsset, rcv);

        const [destinationFee, deliveryFee] = await Promise.all([
          paraClient.calculateDestinationFee(xcm, dot),
          hubClient.calculateDeliveryFee(xcm, rcv.parachainId),
        ]);

        const bridgeFeeInDot =
          deliveryFee + padFeeByPercentage(destinationFee, 25n);

        const feeAssetId = ctx.getAssetId(feeAsset);
        const bridgeFeeInWei = await ctx.evmClient.getProvider().readContract({
          abi: Abi.Snowbridge,
          address: ctxSb.getGateway() as `0x${string}`,
          args: [feeAssetId as `0x${string}`, rcv.parachainId, bridgeFeeInDot],
          functionName: 'quoteSendTokenFee',
        });
        return {
          amount: bridgeFeeInWei,
          breakdown: { bridgeFeeInDot: bridgeFeeInDot },
        } as FeeAmount;
      },
    }),

    calculateOutboundFeeV1: (opts: SendFeeOpts): FeeAmountConfigBuilder => ({
      build: async ({ transferAsset, feeAsset, source }) => {
        const ctx = source as Parachain;

        const client = new AssethubClient(opts.hub);

        const xcm = buildERC20TransferFromPara(transferAsset, ctx);
        const returnToSenderXcm = buildParaERC20Received(transferAsset, ctx);

        const [
          bridgeDeliveryFee,
          bridgeHubDeliveryFee,
          assetHubDestinationFee,
          returnToSenderDeliveryFee,
          returnToSenderDestinationFee,
        ] = await Promise.all([
          client.getBridgeDeliveryFeeV1(),
          client.calculateDeliveryFee(xcm, BRIDGE_HUB_ID),
          client.calculateDestinationFee(xcm, feeAsset),
          client.calculateDeliveryFee(returnToSenderXcm, ctx.parachainId),
          client.calculateDestinationFee(returnToSenderXcm, feeAsset),
        ]);

        const bridgeFeeInDot =
          bridgeDeliveryFee +
          bridgeHubDeliveryFee +
          padFeeByPercentage(assetHubDestinationFee, 25n) +
          returnToSenderDeliveryFee +
          padFeeByPercentage(returnToSenderDestinationFee, 25n);

        return {
          amount: bridgeFeeInDot,
          breakdown: {
            bridgeDeliveryFee,
            bridgeHubDeliveryFee,
            assetHubDestinationFee,
            returnToSenderDeliveryFee,
            returnToSenderDestinationFee,
          },
        } as FeeAmount;
      },
    }),
  };
}

function XcmPaymentApi() {
  return {
    calculateDestFee: (opts?: {
      reserve?: Parachain;
    }): FeeAmountConfigBuilder => ({
      build: async ({ feeAsset, source, destination }) => {
        const src = source as Parachain;
        const rcv = destination as Parachain;
        const reserve = opts?.reserve;

        // Validate reserve chain matches asset's xcm location
        validateReserveChain(feeAsset, src, rcv, reserve);

        // Multi-hop transfer (through reserve chain)
        if (reserve) {
          const rcvClient = new BaseClient(rcv);
          const reserveClient = new BaseClient(reserve);

          const nestedXcm = buildNestedReserveTransfer(feeAsset, rcv);
          const multiHopXcm = buildMultiHopReserveTransfer(
            feeAsset,
            reserve,
            rcv
          );

          const [destinationFee, reserveFee] = await Promise.all([
            rcvClient.calculateDestinationFee(nestedXcm, feeAsset),
            reserveClient.calculateDestinationFee(multiHopXcm, feeAsset),
          ]);

          const totalFee = reserveFee + destinationFee;
          const feeWithMargin = padFeeByPercentage(totalFee, 20n);
          const margin = feeWithMargin - totalFee;

          return {
            amount: feeWithMargin,
            breakdown: {
              reserveFee: reserveFee,
              destinationFee: destinationFee,
              margin: margin,
            },
          } as FeeAmount;
        }

        // Direct reserve transfer
        const client = new BaseClient(rcv);
        const xcm = buildReserveTransfer(feeAsset, rcv);
        const totalFee = await client.calculateDestinationFee(xcm, feeAsset);
        const feeWithMargin = padFeeByPercentage(totalFee, 20n);
        const margin = feeWithMargin - totalFee;

        return {
          amount: feeWithMargin,
          breakdown: {
            totalFee: totalFee,
            margin: margin,
          },
        } as FeeAmount;
      },
    }),
  };
}

function Basejump() {
  return {
    quoteFee: (): FeeAmountConfigBuilder => ({
      build: async ({ feeAsset, source }) => {
        const ctx = source as EvmChain;

        const ctxBj = Bj.fromChain(ctx);

        const feeAssetId = ctx.getAssetId(feeAsset);
        const fee = await ctx.evmClient.getProvider().readContract({
          abi: Abi.Basejump,
          address: ctxBj.getAddress() as `0x${string}`,
          args: [feeAssetId as `0x${string}`],
          functionName: 'quoteFee',
        });
        return { amount: fee } as FeeAmount;
      },
    }),
  };
}

export function FeeAmountBuilder() {
  return {
    Basejump,
    XcmPaymentApi,
    Snowbridge,
    Wormhole,
  };
}
