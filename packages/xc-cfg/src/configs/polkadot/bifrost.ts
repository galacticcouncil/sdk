import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import {
  bnc,
  dot,
  usdc,
  usdt,
  vdot,
  vastr,
  astr,
  glmr,
  ibtc,
} from '../../assets';
import { assetHub, bifrost, hydration, polkadot } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  FeeAmountBuilder,
  XcmTransferType,
} from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: bnc,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: bnc,
      fee: {
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
        asset: bnc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: vdot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: bnc,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: vdot,
      fee: {
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
        asset: vdot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: vastr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: bnc,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: vastr,
      fee: {
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
        asset: vastr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: dot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: bnc,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: dot,
      fee: {
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee({ reserve: polkadot }),
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.RemoteReserve,
    }),
  }),
  new AssetRoute({
    source: {
      asset: astr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: bnc,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: astr,
      fee: {
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
        asset: astr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: bnc,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: glmr,
      fee: {
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: ibtc,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: bnc,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: ibtc,
      fee: {
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
        asset: ibtc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: bnc,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: usdt,
      fee: {
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee({ reserve: assetHub }),
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: usdc,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: bnc,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: usdc,
      fee: {
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee({ reserve: assetHub }),
        asset: usdc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

const toAssetHub: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: bnc,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: assetHub,
      asset: usdt,
      fee: {
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: usdc,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: bnc,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: assetHub,
      asset: usdc,
      fee: {
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
        asset: usdc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

export const bifrostConfig = new ChainRoutes({
  chain: bifrost,
  routes: [...toHydration, ...toAssetHub],
});
