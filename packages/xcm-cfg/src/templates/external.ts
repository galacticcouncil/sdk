import { AssetConfig, ChainAssetData } from '@galacticcouncil/xcm-core';

import { dot, hdx, usdt } from '../assets';
import { AssetMinBuilder, BalanceBuilder, ExtrinsicBuilder } from '../builders';
import { assetHub, hydraDX } from '../chains';

const xcmDeliveryFeeAmount = 0.036;

export function toAhTemplate(assetData: ChainAssetData): AssetConfig {
  return new AssetConfig({
    asset: assetData.asset,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: assetHub,
    destinationFee: {
      amount: 0.18,
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiassets().X3(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  });
}

export function fromAhTemplate(assetData: ChainAssetData): AssetConfig {
  return new AssetConfig({
    asset: assetData.asset,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.02,
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
    },
    extrinsic: ExtrinsicBuilder()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .X2(),
    fee: {
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
      xcmDeliveryFeeAmount,
    },
    min: AssetMinBuilder().assets().asset(),
  });
}
