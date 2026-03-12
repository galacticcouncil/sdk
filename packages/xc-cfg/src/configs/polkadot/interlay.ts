import { Asset, AssetRoute, ChainRoutes, Parachain } from '@galacticcouncil/xc-core';

import { dot, hdx, ibtc, intr, usdc, usdt, vdot } from '../../assets';
import { assetHub, bifrost, hydration, interlay } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  FeeAmountBuilder,
} from '../../builders';

const balance = () => BalanceBuilder().substrate().tokens().accounts();

function toHydrationTemplate(asset: Asset, reserve: Parachain): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      balance: balance(),
      fee: {
        asset: intr,
        balance: balance(),
      },
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: hydration,
      asset: asset,
      fee: {
        amount: FeeAmountBuilder()
          .XcmPaymentApi()
          .calculateDestFee({ reserve }),
        asset: asset,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  });
}

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
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
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
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
        asset: intr,
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
        amount: 0.5,
        asset: hdx,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  toHydrationTemplate(vdot, bifrost),
  toHydrationTemplate(usdt, assetHub),
  toHydrationTemplate(usdc, assetHub),
  toHydrationTemplate(dot, assetHub),
];

export const interlayConfig = new ChainRoutes({
  chain: interlay,
  routes: [...toHydration],
});
