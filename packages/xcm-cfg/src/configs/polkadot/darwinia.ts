import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import { ring } from '../../assets';
import { hydraDX, darwinia } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

export const darwiniaConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: ring,
      balance: BalanceBuilder().substrate().system().account(),
      destination: hydraDX,
      destinationFee: {
        amount: 2,
        asset: ring,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    }),
  ],
  chain: darwinia,
});
