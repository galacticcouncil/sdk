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
import { astar, hydration } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  XcmTransferType,
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
        amount: 0.1,
        asset: bnc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
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
        amount: 0.04,
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
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
        amount: 0.000002,
        asset: ibtc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
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
        amount: 0.2,
        asset: intr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
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
        amount: 0.3,
        asset: pha,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
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
        amount: 0.0004,
        asset: vdot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
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
        amount: 0.025,
        asset: vastr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
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
        amount: 0.3,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
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
        amount: 0.3,
        asset: usdc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
  }),
];

export const astarConfig = new ChainRoutes({
  chain: astar,
  routes: [...toHydration],
});
