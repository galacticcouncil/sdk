import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { aca, ldot } from '../../assets';
import { hydration, acala } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: aca,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: aca,
      fee: {
        amount: 1,
        asset: aca,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: ldot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: aca,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: ldot,
      fee: {
        amount: 0.011,
        asset: ldot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

export const acalaConfig = new ChainRoutes({
  chain: acala,
  routes: [...toHydration],
});
