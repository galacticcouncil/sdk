import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { astr, dot, hdx, usdt } from '../assets';
import { astar, hydraDX } from '../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../builders';

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
    extrinsic: ExtrinsicBuilder().polkadotXcm().reserveTransferAssets().here(),
  }),
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.1,
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
    },
    fee: {
      asset: astr,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
  //   extrinsic: ExtrinsicBuilder().xTokens().transfer()
  // }),
];

export const astarConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: astar,
});
