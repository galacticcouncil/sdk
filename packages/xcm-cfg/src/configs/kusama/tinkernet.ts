import {
  BalanceBuilder,
  ExtrinsicBuilder,
} from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';
import { tnkr } from '../../assets';
import { basilisk, tinkernet } from '../../chains';

export const tinkernetConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: tnkr,
      balance: BalanceBuilder().substrate().system().account(),
      destination: basilisk,
      destinationFee: {
        amount: 0.01355438643,
        asset: tnkr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    }),
  ],
  chain: tinkernet,
});
