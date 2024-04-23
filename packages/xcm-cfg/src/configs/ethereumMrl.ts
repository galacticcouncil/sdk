import { AssetConfig, ChainConfig, Wormhole } from '@galacticcouncil/xcm-core';

import { dai_mwh, eth } from '../assets';
import { ethereumMrl, hydraDX, moonbeam } from '../chains';
import { BalanceBuilder, ContractBuilder } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: dai_mwh,
    balance: BalanceBuilder().evm().erc20(),
    //contract: ContractBuilderV2().Bridge().transferViaMrl(Wormhole.Ethereum),
    destination: hydraDX,
    destinationFee: {
      amount: 0.004,
      asset: dai_mwh,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
    },
  }),
];

const toMoonbeam: AssetConfig[] = [
  new AssetConfig({
    asset: dai_mwh,
    balance: BalanceBuilder().evm().erc20(),
    //contract: ContractBuilderV2().Bridge().transferViaMrl(Wormhole.Ethereum),
    destination: moonbeam,
    destinationFee: {
      amount: 0.004,
      asset: dai_mwh,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
    },
  }),
];

export const ethereumMrlConfig = new ChainConfig({
  assets: [...toHydraDX, ...toMoonbeam],
  chain: ethereumMrl,
});
