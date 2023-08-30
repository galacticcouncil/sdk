import { BalanceBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-config';

import { ibtc } from '../assets';
import { hydraDX, interlay } from '../chains';
import { ExtrinsicBuilderV3 } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: ibtc,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.00000007,
      asset: ibtc,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
  }),
];

export const interlayConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: interlay,
});
