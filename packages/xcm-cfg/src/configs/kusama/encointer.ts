import {
  BalanceBuilder,
} from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';

import { ksm } from '../../assets';
import { encointer, kusama} from '../../chains';
import { ExtrinsicBuilderV2 } from '../../builders';

const xcmDeliveryFeeAmount = 0.0015;

const toKusama: AssetConfig[] = [
  new AssetConfig({
    asset: ksm,
    balance: BalanceBuilder().substrate().system().account(),
    destination: kusama,
    destinationFee: {
      amount: 0.000090049287,
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilderV2()
      .polkadotXcm()
      .limitedTeleportAssets(1)
      .here(),
    fee: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      xcmDeliveryFeeAmount,
    },
  }),
];

export const encointerConfig = new ChainConfig({
  assets: [...toKusama],
  chain: encointer,
});
