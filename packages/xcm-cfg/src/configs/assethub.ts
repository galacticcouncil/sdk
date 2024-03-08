import {
  AssetMinBuilder,
  BalanceBuilder,
  ExtrinsicBuilder,
  FeeBuilder,
} from '@moonbeam-network/xcm-builder';
import {
  AssetConfig,
  ChainConfig,
  interlay,
  moonbeam,
  polkadot,
} from '@moonbeam-network/xcm-config';

import { dot, usdc, usdt } from '../assets';
import { assetHub, hydraDX } from '../chains';
import { ExtrinsicBuilderV2 } from '../builders';

const xcmDeliveryFeeAmount = 0.036;

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: hydraDX,
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
    },
    min: AssetMinBuilder().assets().asset(),
  }),
  new AssetConfig({
    asset: usdc,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: hydraDX,
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
    },
    min: AssetMinBuilder().assets().asset(),
  }),
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
    extrinsic: ExtrinsicBuilderV2()
      .polkadotXcm()
      .limitedTeleportAssets(1)
      .here(),
    fee: {
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
    },
    min: AssetMinBuilder().assets().asset(),
  }),
];

const toMoonbeam: AssetConfig[] = [
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: moonbeam,
    destinationFee: {
      amount: FeeBuilder().assetManager().assetTypeUnitsPerSecond(),
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
      amount: FeeBuilder().assetManager().assetTypeUnitsPerSecond(),
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

const toInterlay: AssetConfig[] = [
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: interlay,
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
    },
    min: AssetMinBuilder().assets().asset(),
  }),
  new AssetConfig({
    asset: usdc,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: interlay,
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
    },
    min: AssetMinBuilder().assets().asset(),
  }),
];

export const assetHubConfig = new ChainConfig({
  assets: [...toHydraDX, ...toPolkadot, ...toMoonbeam, ...toInterlay],
  chain: assetHub,
});
