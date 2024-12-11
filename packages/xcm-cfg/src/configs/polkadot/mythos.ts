import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { myth } from '../../assets';
import { assetHub, hydration, mythos } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilderV4 } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: myth,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: myth,
      fee: {
        amount: 0.003023,
        asset: myth,
      },
    },
    extrinsic: ExtrinsicBuilderV4()
      .polkadotXcm()
      .limitedReserveTransferAssets(),
  }),
];

const toAssethub: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: myth,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: assetHub,
      asset: myth,
      fee: {
        amount: 0.035,
        asset: myth,
      },
    },
    extrinsic: ExtrinsicBuilderV4().polkadotXcm().limitedTeleportAssets(),
  }),
];

export const mythosConfig = new ChainRoutes({
  chain: mythos,
  routes: [...toHydration, ...toAssethub],
});
