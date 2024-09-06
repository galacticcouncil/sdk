import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { ded, dot, dota, pink, usdc, usdt, wud } from '../../../assets';
import {
  assetHub,
  bifrost,
  hydration,
  moonbeam,
  polkadot,
} from '../../../chains';
import {
  AssetMinBuilder,
  BalanceBuilder,
  ExtrinsicBuilder,
} from '../../../builders';
import { toHydrationExtTemplate, xcmDeliveryFeeAmount } from './templates';

const toHydration: AssetConfig[] = [
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: hydration,
    destinationFee: {
      amount: 0.0022,
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
  }),
  new AssetConfig({
    asset: usdc,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: hydration,
    destinationFee: {
      amount: 0.02,
      asset: usdc,
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
  }),

  new AssetConfig({
    asset: pink,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: hydration,
    destinationFee: {
      amount: 0.02,
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
    },
    extrinsic: ExtrinsicBuilder()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .X2(),
    // extrinsic: ExtrinsicBuilder()
    //   .utility()
    //   .batchAll([
    //     ExtrinsicBuilder().assetConversion().swapTokensForExactTokens(),
    //     ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets().X2(),
    //   ]),
    fee: {
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
      xcmDeliveryFeeAmount,
    },
    min: AssetMinBuilder().assets().asset(),
  }),
  toHydrationExtTemplate(ded),
  toHydrationExtTemplate(dota),
  toHydrationExtTemplate(wud),
];

const toPolkadot: AssetConfig[] = [
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().system().account(),
    destination: polkadot,
    destinationFee: {
      amount: 0.003,
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedTeleportAssets(1).here(),
    fee: {
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
      xcmDeliveryFeeAmount,
    },
    min: AssetMinBuilder().assets().asset(),
  }),
];

const toMoonbeam: AssetConfig[] = [
  new AssetConfig({
    asset: pink,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.03,
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
  }),
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: moonbeam,
    destinationFee: {
      //amount: FeeBuilder().assetManager().assetTypeUnitsPerSecond(),
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
  }),
  new AssetConfig({
    asset: usdc,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.03,
      asset: usdc,
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
  }),
];

const toBifrost: AssetConfig[] = [
  new AssetConfig({
    asset: pink,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: bifrost,
    destinationFee: {
      amount: 0.0001,
      asset: pink,
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
  }),
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: bifrost,
    destinationFee: {
      amount: 0.03,
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
  }),
  new AssetConfig({
    asset: usdc,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: bifrost,
    destinationFee: {
      amount: 0.03,
      asset: usdc,
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
  }),
];

export const assetHubConfig = new ChainConfig({
  assets: [...toHydration, ...toPolkadot, ...toMoonbeam, ...toBifrost],
  chain: assetHub,
});
