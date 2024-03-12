import {
  BalanceBuilder,
  ExtrinsicBuilder,
} from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';
import { teer } from '../../assets';
import { basilisk, integritee } from '../../chains';

export const integriteeConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: teer,
      balance: BalanceBuilder().substrate().system().account(),
      destination: basilisk,
      destinationFee: {
        amount: 0.00275,
        asset: teer,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    }),
  ],
  chain: integritee,
});
