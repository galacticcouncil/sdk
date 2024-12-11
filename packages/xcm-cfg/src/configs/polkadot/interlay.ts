import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { dot, hdx, ibtc, intr, vdot } from '../../assets';
import { hydration, interlay } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilderV4 } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: intr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: intr,
      fee: {
        amount: 0.13,
        asset: intr,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: ibtc,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: intr,
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: ibtc,
      fee: {
        amount: 0.03,
        asset: intr,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: dot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: intr,
        balance: BalanceBuilder().substrate().tokens().accounts(),
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
      asset: hdx,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: intr,
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: hdx,
      fee: {
        amount: 0.1,
        asset: hdx,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: vdot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: intr,
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: vdot,
      fee: {
        amount: 0.001,
        asset: vdot,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

export const interlayConfig = new ChainRoutes({
  chain: interlay,
  routes: [...toHydration],
});
