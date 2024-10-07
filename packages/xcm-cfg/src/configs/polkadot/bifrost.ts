import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { bnc, dot, pink, usdc, usdt, vdot, vastr } from '../../assets';
import { assetHub, bifrost, hydration, polkadot } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toAssetHub: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: pink,
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
      asset: pink,
      fee: {
        amount: 0.18,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiassets().X3(),
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
      chain: assetHub,
      asset: usdt,
      fee: {
        amount: 0.18,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiassets().X3(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiassets().X3(),
  }),
];

export const bifrostConfig = new ChainRoutes({
  chain: bifrost,
  routes: [...toHydration, ...toPolkadot, ...toAssetHub],
});
