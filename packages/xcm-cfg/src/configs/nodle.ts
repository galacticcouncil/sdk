import {
  BalanceBuilder,
  ExtrinsicBuilder,
} from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';
import { nodl } from 'assets';
import { hydraDX, nodle } from '../chains';

export const nodleConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: nodl,
      balance: BalanceBuilder().substrate().system().account(),
      destination: hydraDX,
      destinationFee: {
        amount: 1.8,
        asset: nodl,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder().xTransfer().transfer().here(),
    }),
  ],
  chain: nodle,
});
