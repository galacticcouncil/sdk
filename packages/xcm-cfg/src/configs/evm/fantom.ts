import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { dai, eth } from '../../assets';
import { fantom, moonbeam } from '../../chains';
import { BalanceBuilder, ContractBuilder } from '../../builders';

const toMoonbeam: AssetConfig[] = [
  new AssetConfig({
    asset: dai,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().TokenBridge().transferTokens(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.004,
      asset: dai,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
    },
  }),
];

export const fantomConfig = new ChainConfig({
  assets: [...toMoonbeam],
  chain: fantom,
});
