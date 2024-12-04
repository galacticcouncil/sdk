import {
  AnyChain,
  Asset,
  AssetRoute,
  ExtrinsicConfigBuilderParams,
} from '@galacticcouncil/xcm-core';

import { dot, usdt } from '../../../assets';
import {
  AssetMinBuilder,
  BalanceBuilder,
  ExtrinsicBuilder,
  ExtrinsicDecorator,
} from '../../../builders';
import { hydration, moonbeam } from '../../../chains';

export const xcmDeliveryFee = 0.036;

const isSwapSupported = (params: ExtrinsicConfigBuilderParams) => {
  const { source } = params;
  const { enabled } = source.feeSwap || {};
  return !!enabled;
};

const swapExtrinsic = ExtrinsicBuilder()
  .assetConversion()
  .swapTokensForExactTokens({ withSlippage: 30 });

function toParachainExtTemplate(
  asset: Asset,
  destination: AnyChain,
  destinationFee: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
      min: AssetMinBuilder().assets().asset(),
    },
    destination: {
      chain: destination,
      asset: asset,
      fee: {
        amount: destinationFee,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicDecorator(isSwapSupported, swapExtrinsic).prior(
      ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets().X2()
    ),
  });
}

export function toHydrationExtTemplate(asset: Asset): AssetRoute {
  return toParachainExtTemplate(asset, hydration, 0.02);
}

export function toMoonbeamExtTemplate(asset: Asset): AssetRoute {
  return toParachainExtTemplate(asset, moonbeam, 0.25);
}
