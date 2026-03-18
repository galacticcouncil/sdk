import {
  Abi,
  EvmChain,
  FeeAmount,
  FeeAmountConfigBuilder,
  Parachain,
  Wormhole as Wh,
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
  buildSnowbridgeOutboundXcm,
  etherLocation,
} from './extrinsics/xcm';
import { validateReserveChain } from './extrinsics/xcm/utils';
import { padFeeByPercentage } from './utils';

import { dot } from '../assets';
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

        // 1. Query all DOT-denominated fees
        const [
          destinationExecutionFeeDot,
          destinationDeliveryFeeDot,
          assetHubDeliveryFeeDot,
          assetHubExecutionFeeDotRaw,
        ] = await Promise.all([
          paraClient.calculateDestinationFeeV5(xcmV5, dot),
          hubClient.calculateDeliveryFee(xcm, rcv.parachainId),
          hubClient.calculateDeliveryFee(xcm, BRIDGE_HUB_ID),
          hubClient.calculateDestinationFee(xcm, dot),
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

        // 2. Convert all DOT fees to Ether via AssetHub DEX
        const [
          assetHubDeliveryFeeEther,
          destinationDeliveryFeeEther,
          destinationExecutionFeeEther,
          extrinsicFeeEther,
          assetHubExecutionFeeEther,
        ] = await Promise.all([
          hubClient.quoteDotToEther(etherLoc, paddedAssetHubDeliveryDot),
          hubClient.quoteDotToEther(etherLoc, paddedDestDeliveryDot),
          hubClient.quoteDotToEther(etherLoc, paddedDestExecutionDot),
          hubClient.quoteDotToEther(etherLoc, extrinsicFeeDot),
          hubClient.quoteDotToEther(etherLoc, assetHubExecutionFeeDot),
        ]);

        // 3. Compute V2 fee params
        const executionFee =
          assetHubExecutionFeeEther + destinationDeliveryFeeEther;

        const relayerFee = padFeeByPercentage(
          extrinsicFeeEther + assetHubDeliveryFeeEther,
          30n
        );

        // Remote DOT fee: DOT needed on the destination parachain
        const remoteDotFee = paddedDestExecutionDot;

        // Remote ether fee: Ether needed to buy DOT on AssetHub
        const remoteEtherFee = padFeeByPercentage(
          await hubClient.quoteEtherForDot(etherLoc, remoteDotFee),
          50n
        );

        const totalFeeInWei = executionFee + relayerFee + remoteEtherFee;

        return {
          amount: totalFeeInWei,
          breakdown: {
            executionFee,
            relayerFee,
            remoteEtherFee,
            remoteDotFee,
            assetHubDeliveryFeeEther,
            assetHubExecutionFeeEther,
            destinationDeliveryFeeEther,
            destinationExecutionFeeEther,
          },
        } as FeeAmount;
      },
    }),
    calculateOutboundFee: (opts: SendFeeOpts): FeeAmountConfigBuilder => ({
      build: async ({ transferAsset, feeAsset, source }) => {
        const ctx = source as Parachain;

        const hubClient = new AssethubClient(opts.hub);
        const etherLoc = etherLocation(ETHEREUM_CHAIN_ID);

        const xcm = buildERC20TransferFromPara(transferAsset, ctx);
        const returnToSenderXcm = buildParaERC20Received(transferAsset, ctx);

        const [
          bridgeDeliveryFee,
          bridgeHubDeliveryFee,
          assetHubDestinationFee,
          returnToSenderDeliveryFee,
          returnToSenderDestinationFee,
        ] = await Promise.all([
          hubClient.getBridgeDeliveryFee(),
          hubClient.calculateDeliveryFee(xcm, BRIDGE_HUB_ID),
          hubClient.calculateDestinationFee(xcm, feeAsset),
          hubClient.calculateDeliveryFee(returnToSenderXcm, ctx.parachainId),
          hubClient.calculateDestinationFee(returnToSenderXcm, feeAsset),
        ]);

        // Hardcoded BridgeHub extrinsic fee
        const extrinsicFeeDot = 250_000_000n;

        const etherFeeAmount = await hubClient.quoteDotToEther(
          etherLoc,
          extrinsicFeeDot
        );

        // DOT for AssetHub execution + downstream deliveries (remote_fees)
        const dotRemoteFee =
          bridgeDeliveryFee +
          bridgeHubDeliveryFee +
          padFeeByPercentage(assetHubDestinationFee, 25n) +
          returnToSenderDeliveryFee +
          padFeeByPercentage(returnToSenderDestinationFee, 25n);

        // DOT to swap for Ether on AssetHub (padded for AMM slippage)
        const dotToEtherSwapAmount = padFeeByPercentage(extrinsicFeeDot, 20n);

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
          topic: '0x' + '00'.repeat(32),
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

export function FeeAmountBuilder() {
  return {
    XcmPaymentApi,
    Snowbridge,
    Wormhole,
  };
}
