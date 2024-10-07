import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { dot, hdx, ibtc, intr } from '../../assets';
import { hydration, interlay } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

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
        amount: 0.136389,
        asset: intr,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
        amount: 0.00000007,
        asset: ibtc,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const interlayConfig = new ChainRoutes({
  chain: interlay,
  routes: [...toHydration],
});
