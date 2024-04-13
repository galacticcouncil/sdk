import { Wormhole } from '@galacticcouncil/xcm-core';
import { BalanceBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';

import { dai_mwh, eth } from '../assets';
import { acalaMrl, hydraDX } from '../chains';
import { BalanceBuilderV2, ContractBuilderV2 } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: dai_mwh,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilderV2().Bridge().mrlViaWormhole(Wormhole.Acala),
    destination: hydraDX,
    destinationFee: {
      amount: 0.004,
      asset: dai_mwh,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: eth,
      balance: BalanceBuilderV2().evm().native(),
    },
  }),
];

export const acalaMrlConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: acalaMrl,
});
