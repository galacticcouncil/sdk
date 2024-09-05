import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import { pen } from '../../assets';
import { hydration, pendulum } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

export const pendulumConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: pen,
      balance: BalanceBuilder().substrate().system().account(),
      destination: hydration,
      destinationFee: {
        amount: 0.2,
        asset: pen,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    }),
  ],
  chain: pendulum,
});
