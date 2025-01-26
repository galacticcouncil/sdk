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

const isFeeSwapSupported = (params: ExtrinsicConfigBuilderParams) => {
  const { source } = params;
  const { enabled } = source.feeSwap || {};
  return !!enabled;
};

const isDestinationFeeSwapSupported = (
  params: ExtrinsicConfigBuilderParams
) => {
  const { source } = params;
  const { enabled } = source.destinationFeeSwap || {};
  return !!enabled;
};

const getSwapExtrinsicBuilder = (key: 'destinationFeeSwap' | 'feeSwap') => {
  return ExtrinsicBuilder().assetConversion().swapTokensForExactTokens({
    withSlippage: 30,
    key: key,
  });
};

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
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      getSwapExtrinsicBuilder('destinationFeeSwap')
    ).prior(ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets()),
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
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
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
        asset: asset,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isFeeSwapSupported,
      getSwapExtrinsicBuilder('feeSwap')
    ).prior(ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets()),
  });
}

export function toHydrationExtTemplate(asset: Asset): AssetRoute {
  return toParachainExtTemplate(asset, hydration, 0.02);
}

export function toMoonbeamExtTemplate(asset: Asset): AssetRoute {
  return toParachainExtTemplate(asset, moonbeam, 0.25);
}
