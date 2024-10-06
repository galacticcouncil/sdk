import {
  AnyChain,
  Asset,
  AssetConfig,
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
  fee: number
): AssetConfig {
  return new AssetConfig({
    asset: asset,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: destination,
    destinationFee: {
      amount: fee,
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
    },
    extrinsic: ExtrinsicDecorator(isSwapSupported, swapExtrinsic).prior(
      ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets().X2()
    ),
    fee: {
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
      extra: xcmDeliveryFee,
    },
    min: AssetMinBuilder().assets().asset(),
  });
}

export function toHydrationExtTemplate(asset: Asset): AssetConfig {
  return toParachainExtTemplate(asset, hydration, 0.02);
}

export function toMoonbeamExtTemplate(asset: Asset): AssetConfig {
  return toParachainExtTemplate(asset, moonbeam, 0.03);
}
