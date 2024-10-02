import { Asset, AssetConfig } from '@galacticcouncil/xcm-core';

import { dot, usdt } from '../../../assets';
import { AssetMinBuilder, BalanceBuilder } from '../../../builders';
import { hydration } from '../../../chains';

import { extrinsicSwap } from './configs';

export const xcmDeliveryFeeAmount = 0.036;

export function toHydrationExtTemplate(asset: Asset): AssetConfig {
  return new AssetConfig({
    asset: asset,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: hydration,
    destinationFee: {
      amount: 0.02,
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
    },
    extrinsic: extrinsicSwap(),
    fee: {
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
      xcmDeliveryFeeAmount,
    },
    min: AssetMinBuilder().assets().asset(),
  });
}
