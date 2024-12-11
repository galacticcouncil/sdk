import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { glmr, usdc_mwh, ztg } from '../../assets';
import { hydration, zeitgeist } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilderV4 } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ztg,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: ztg,
      fee: {
        amount: 0.0225,
        asset: ztg,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: ztg,
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
        amount: 0.0035,
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: usdc_mwh,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: ztg,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: usdc_mwh,
      fee: {
        amount: 0.1,
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transferMultiCurrencies(),
  }),
];

export const zeitgeistConfig = new ChainRoutes({
  chain: zeitgeist,
  routes: [...toHydration],
});
