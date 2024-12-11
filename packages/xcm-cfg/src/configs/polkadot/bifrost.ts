import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

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
import { BalanceBuilder, ExtrinsicBuilderV4 } from '../../builders';

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
        amount: 0.014645,
        asset: bnc,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
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
        amount: 0.000555,
        asset: vdot,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
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
        amount: 0.0115,
        asset: vastr,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
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
        amount: 0.1,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
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
        amount: 0.5,
        asset: astr,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
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
        amount: 0.1,
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
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
        amount: 0.000002,
        asset: ibtc,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

const toPolkadot: AssetRoute[] = [
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
      chain: polkadot,
      asset: dot,
      fee: {
        amount: 0.003,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
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
        amount: 0.18,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transferMultiassets(),
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
        amount: 0.18,
        asset: usdc,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transferMultiassets(),
  }),
];

export const bifrostConfig = new ChainRoutes({
  chain: bifrost,
  routes: [...toHydration, ...toPolkadot, ...toAssetHub],
});
