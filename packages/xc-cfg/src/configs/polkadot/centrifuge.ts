import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { cfg, dot, glmr } from '../../assets';
import { centrifuge, hydration } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  FeeAmountBuilder,
} from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: cfg,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: cfg,
      fee: {
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
        asset: cfg,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: glmr,
      balance: BalanceBuilder().substrate().ormlTokens().accounts(),
      fee: {
        asset: cfg,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().ormlTokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: glmr,
      fee: {
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

export const centrifugeConfig = new ChainRoutes({
  chain: centrifuge,
  routes: [...toHydration],
});
