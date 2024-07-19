import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { myth } from '../../assets';
import { hydraDX, mythos } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

export const mythosConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: myth,
      balance: BalanceBuilder().substrate().system().account(),
      destination: hydraDX,
      destinationFee: {
        amount: 0.22,
        asset: myth,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder().polkadotXcm().teleportAssets(0).here(),
    }),
  ],
  chain: mythos,
});
