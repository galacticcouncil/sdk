import {
  Abi,
  EvmChain,
  FeeAmount,
  FeeAmountConfigBuilder,
  Parachain,
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
import { padFeeByPercentage, scaledPadPercentage } from './utils';

import { dot } from '../assets';
import {
  ASSETHUB_ETHER_ED,
  SNOWBRIDGE_BASE_DISPATCH_GAS,
  SNOWBRIDGE_BASE_VERIFICATION_GAS,
  SNOWBRIDGE_TOKEN_DELIVERY_GAS,
  SNOWBRIDGE_FIAT_SHAMIR_GAS,
  SNOWBRIDGE_SUBMIT_GAS,
  SnowbridgeFast,
  getVolumeTipInWei,
} from '../bridges/snowbridge';
import { hydration } from '../chains';
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

type OutboundFeeOpts = SendFeeOpts & {
  fast?: SnowbridgeFast;
};

function Snowbridge() {
  return {
    calculateInboundFee: (opts: SendFeeOpts): FeeAmountConfigBuilder => ({
      build: async ({ feeAsset, transferAsset, destination, amount }) => {
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

        // 1. Query DOT-denominated fees (and the volume tip — fully
        // independent of everything else, so it rides the same round-trip).
        const [
          destinationExecutionFeeDot,
          destinationDeliveryFeeDot,
          assetHubDeliveryFeeDot,
          assetHubExecutionFeeDotRaw,
          volumeTip,
        ] = await Promise.all([
          paraClient.calculateDestinationFeeV5(xcmV5, dot),
          hubClient.calculateDeliveryFee(xcm, rcv.parachainId),
          hubClient.calculateDeliveryFee(xcm, BRIDGE_HUB_ID),
          hubClient.calculateDestinationFeeV5(dummyInboundXcm, dot),
          getVolumeTipInWei(hydration.dex, transferAsset, amount ?? 0n),
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

        // 5. Total wei the user pays. Volume tip (V2 standard relayer fee)
        // was fetched alongside the DOT-denominated fees above; it's zero
        // when amount is absent (preview render).
        const totalFeeInWei =
          executionFee + relayerFee + remoteEtherFee + volumeTip;

        return {
          amount: totalFeeInWei,
          breakdown: {
            executionFee,
            relayerFee,
            remoteEtherFee,
            hydrationDotFee,
            volumeTip,
          },
        } as FeeAmount;
      },
    }),
    calculateOutboundFee: (opts: OutboundFeeOpts): FeeAmountConfigBuilder => ({
      build: async ({
        transferAsset,
        feeAsset,
        source,
        destination,
        amount,
      }) => {
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
        const submitGas = opts.fast
          ? SNOWBRIDGE_FIAT_SHAMIR_GAS
          : SNOWBRIDGE_SUBMIT_GAS;
        const totalGas =
          submitGas +
          SNOWBRIDGE_BASE_VERIFICATION_GAS +
          SNOWBRIDGE_BASE_DISPATCH_GAS +
          SNOWBRIDGE_TOKEN_DELIVERY_GAS;

        const volumeTipWei = await getVolumeTipInWei(
          hydration.dex,
          transferAsset,
          amount ?? 0n
        );
        // The volume tip already over-covers gas drift and swap slippage, so
        // both pads decay as the tip grows (matching Snowbridge). Without this,
        // a flat 33%/20% pad on top of a large tip over-charges the user.
        const rawGasFee = gasPrice * totalGas;
        const scaledGasPad = scaledPadPercentage(33n, volumeTipWei, rawGasFee);
        const etherFeeAmount =
          padFeeByPercentage(rawGasFee, scaledGasPad) + volumeTipWei;

        // DOT for AssetHub execution + downstream deliveries (remote_fees)
        const dotRemoteFee =
          bridgeDeliveryFee +
          padFeeByPercentage(bridgeHubDeliveryFee, 33n) +
          padFeeByPercentage(assetHubDestinationFee, 33n);

        const scaledSlippagePad = scaledPadPercentage(
          20n,
          volumeTipWei,
          rawGasFee
        );
        const dotToEtherSwapAmount = padFeeByPercentage(
          await hubClient.quoteDotForExactEther(etherLoc, etherFeeAmount),
          scaledSlippagePad
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

        const volumeTipDot =
          etherFeeAmount === 0n
            ? 0n
            : (volumeTipWei * dotToEtherSwapAmount) / etherFeeAmount;

        const totalDotFee =
          dotRemoteFee + dotToEtherSwapAmount + sourceExecutionFee;

        return {
          amount: totalDotFee,
          breakdown: {
            dotRemoteFee,
            dotToEtherSwapAmount,
            etherFeeAmount,
            sourceExecutionFee,
            volumeTip: volumeTipDot,
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
