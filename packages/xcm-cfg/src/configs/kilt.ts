import {
  BalanceBuilder,
  ExtrinsicBuilder,
} from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';
import { kilt } from '../assets';
import { hydraDX, kilt_chain } from '../chains';

export const kiltConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: kilt,
      balance: BalanceBuilder().substrate().system().account(),
      destination: hydraDX,
      destinationFee: {
        amount: 0.03,
        asset: kilt,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets().here(),
    }),
  ],
  chain: kilt_chain,
});