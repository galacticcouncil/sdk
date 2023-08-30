import { BalanceBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-config';

import { ztg } from '../assets';
import { hydraDX, zeitgeist } from '../chains';
import { ExtrinsicBuilderV3 } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: ztg,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.0225,
      asset: ztg,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
  }),
];

export const zeitgeistConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: zeitgeist,
});
