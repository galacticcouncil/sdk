import { BalanceBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';

import { astr, dot, hdx, usdt } from '../assets';
import { astar, hydraDX } from '../chains';
import { ExtrinsicBuilderV2 } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: astr,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.044306118,
      asset: astr,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilderV2()
      .polkadotXcm()
      .reserveTransferAssets()
      .here(),
  }),
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.044306118,
      asset: astr,
      balance: BalanceBuilder().substrate().system().account(),
    },
    fee: {
      asset: astr,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer()
  }),
  // TODO: Uncomment with asset hub release 1.7 (jit_withdraw fix)
  // new AssetConfig({
  //   asset: usdt,
  //   balance: BalanceBuilder().substrate().assets().account(),
  //   destination: hydraDX,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdt,
  //     balance: BalanceBuilder().substrate().assets().account(),
  //   },
  //   fee: {
  //     asset: astr,
  //     balance: BalanceBuilder().substrate().system().account(),
  //   },
  //   extrinsic: ExtrinsicBuilderV2().xTokens().transfer()
  // }),
];

export const astarConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: astar,
});
