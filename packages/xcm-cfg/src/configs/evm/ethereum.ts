import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { dai, glmr, eth } from '../../assets';
import { ethereum, hydraDX, moonbeam } from '../../chains';
import { BalanceBuilder, ContractBuilder } from '../../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: dai,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().TokenBridge().transferTokensWithPayload().mrl(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.08,
      asset: glmr,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
    },
    via: moonbeam,
  }),
  new AssetConfig({
    asset: eth,
    balance: BalanceBuilder().evm().native(),
    contract: ContractBuilder()
      .TokenBridge()
      .wrapAndTransferETHWithPayload()
      .mrl(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.08,
      asset: glmr,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
    },
    via: moonbeam,
  }),
];

const toMoonbeam: AssetConfig[] = [
  new AssetConfig({
    asset: dai,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().TokenBridge().transferTokens(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.08,
      asset: glmr,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
    },
  }),
];

export const ethereumConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: ethereum,
});
