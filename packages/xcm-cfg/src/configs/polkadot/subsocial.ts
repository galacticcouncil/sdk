import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { sub } from '../../assets';
import { hydration, subsocial } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetConfig[] = [
  new AssetConfig({
    asset: sub,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydration,
    destinationFee: {
      amount: 0.0003525641,
      asset: sub,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .here(),
    fee: {
      asset: sub,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

export const subsocialConfig = new ChainConfig({
  assets: [...toHydration],
  chain: subsocial,
});
