import {
  AnyChain,
  Asset,
  AssetRoute,
  ExtrinsicConfigBuilderParams,
} from '@galacticcouncil/xc-core';

import { dot, usdt } from '../../../assets';
import {
  ExtrinsicBuilder,
  ExtrinsicDecorator,
  XcmTransferType,
} from '../../../builders';
import { hydration, moonbeam } from '../../../chains';

// const xcmDeliveryFee = 0.036;

export const extraFee = 0;

const isSwapSupported = (params: ExtrinsicConfigBuilderParams) => {
  const { source } = params;
  return !!source.feeSwap;
};

const isDestinationFeeSwapSupported = (
  params: ExtrinsicConfigBuilderParams
) => {
  const { source } = params;
  const { enabled } = source.destinationFeeSwap || {};
  return !!enabled;
};

const swapExtrinsicBuilder = ExtrinsicBuilder()
  .assetConversion()
  .swapTokensForExactTokens({
    slippage: 30,
  });

function toParaExtTemplate(
  asset: Asset,
  destination: AnyChain,
  destinationFee: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      fee: {
        asset: dot,
        extra: extraFee,
      },
    },
    destination: {
      chain: destination,
      asset: asset,
      fee: {
        amount: destinationFee,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).prior(ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets()),
  });
}

export function toParaReservesWithSwapTemplate(
  asset: Asset,
  destination: AnyChain,
  destinationFee: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      fee: {
        asset: asset,
        swap: true,
      },
    },
    destination: {
      chain: destination,
      asset: asset,
      fee: {
        amount: destinationFee,
        asset: asset,
      },
    },
    extrinsic: ExtrinsicDecorator(isSwapSupported, swapExtrinsicBuilder).prior(
      ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
        transferType: XcmTransferType.LocalReserve,
      })
    ),
  });
}

export function toParaStablesTemplate(
  asset: Asset,
  destination: AnyChain,
  destinationFee: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      fee: {
        asset: dot,
        extra: extraFee,
      },
    },
    destination: {
      chain: destination,
      asset: asset,
      fee: {
        amount: destinationFee,
        asset: asset,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
  });
}

export function toHydrationExtTemplate(asset: Asset): AssetRoute {
  return toParaExtTemplate(asset, hydration, 0.02);
}

export function toMoonbeamExtTemplate(asset: Asset): AssetRoute {
  return toParaExtTemplate(asset, moonbeam, 0.25);
}
