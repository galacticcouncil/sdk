import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { astr, usdc, usdt, vdot } from '../../assets';
import { assetHub, astar, bifrost, hydration } from '../../chains';
import { ExtrinsicBuilder, FeeAmountBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  // new AssetRoute({
  //   source: {
  //     asset: dot,
  //     balance: BalanceBuilder().substrate().assets().account(),
  //     fee: {
  //       asset: astr,
  //       balance: BalanceBuilder().substrate().system().account(),
  //     },
  //     destinationFee: {
  //       balance: BalanceBuilder().substrate().assets().account(),
  //     },
  //   },
  //   destination: {
  //     chain: hydration,
  //     asset: dot,
  //     fee: {
  //       amount: 0.1,
  //       asset: dot,
  //     },
  //   },
  //   extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
  //     transferType: XcmTransferType.RemoteReserve,
  //   }),
  // }),
  new AssetRoute({
    source: {
      asset: vdot,
      fee: {
        asset: astr,
      },
    },
    destination: {
      chain: hydration,
      asset: vdot,
      fee: {
        amount: FeeAmountBuilder()
          .XcmPaymentApi()
          .calculateDestFee({ reserve: bifrost }),
        asset: vdot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: usdt,
      fee: {
        asset: astr,
      },
    },
    destination: {
      chain: hydration,
      asset: usdt,
      fee: {
        amount: FeeAmountBuilder()
          .XcmPaymentApi()
          .calculateDestFee({ reserve: assetHub }),
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: usdc,
      fee: {
        asset: astr,
      },
    },
    destination: {
      chain: hydration,
      asset: usdc,
      fee: {
        amount: FeeAmountBuilder()
          .XcmPaymentApi()
          .calculateDestFee({ reserve: assetHub }),
        asset: usdc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

export const astarConfig = new ChainRoutes({
  chain: astar,
  routes: [...toHydration],
});
