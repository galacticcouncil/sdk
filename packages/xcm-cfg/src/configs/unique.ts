import {
  BalanceBuilder,
  ExtrinsicBuilder,
} from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';
import { unq } from 'assets';
import { hydraDX, unique } from '../chains';

export const uniqueConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: unq,
      balance: BalanceBuilder().substrate().system().account(),
      destination: hydraDX,
      destinationFee: {
        amount: 1.8,
        asset: unq,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder().xTransfer().transfer().here(),
    }),
  ],
  chain: unique,
});
