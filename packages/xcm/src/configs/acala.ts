import { BalanceBuilder, ExtrinsicBuilder, FeeBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-config';

import { daiAcala } from '../assets';
import { hydraDX, acala } from '../chains';

export const acalaConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: daiAcala,
      balance: BalanceBuilder().evm().erc20(),
      destination: hydraDX,
      destinationFee: {
        amount: FeeBuilder().assetManager().assetTypeUnitsPerSecond(),
        asset: daiAcala,
      },
      extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    }),
  ],
  chain: acala,
});
