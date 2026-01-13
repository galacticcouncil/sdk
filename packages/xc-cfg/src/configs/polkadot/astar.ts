import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import {
  astr,
  bnc,
  dot,
  glmr,
  ibtc,
  intr,
  pha,
  usdc,
  usdt,
  vastr,
  vdot,
} from '../../assets';
import { assetHub, astar, bifrost, hydration } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  FeeAmountBuilder,
} from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: astr,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: astr,
      fee: {
        amount: 0.044306118,
        asset: astr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().reserveTransferAssets(),
  }),
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
      asset: bnc,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: astr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: bnc,
      fee: {
        amount: FeeAmountBuilder()
          .XcmPaymentApi()
          .calculateDestFee({ reserve: bifrost }),
        asset: bnc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: glmr,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: astr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: glmr,
      fee: {
        amount: FeeAmountBuilder()
          .XcmPaymentApi()
          .calculateDestFee(),
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: ibtc,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: astr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: ibtc,
      fee: {
        amount: FeeAmountBuilder()
          .XcmPaymentApi()
          .calculateDestFee(),
        asset: ibtc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: intr,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: astr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: intr,
      fee: {
        amount: FeeAmountBuilder()
          .XcmPaymentApi()
          .calculateDestFee(),
        asset: intr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: pha,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: astr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: pha,
      fee: {
        amount: FeeAmountBuilder()
          .XcmPaymentApi()
          .calculateDestFee(),
        asset: pha,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: vdot,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: astr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
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
      asset: vastr,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: astr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: vastr,
      fee: {
        amount: FeeAmountBuilder()
          .XcmPaymentApi()
          .calculateDestFee(),
        asset: vastr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: astr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
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
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: astr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
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
