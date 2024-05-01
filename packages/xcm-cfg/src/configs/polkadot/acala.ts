import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { aca, dai_awh, glmr, wbtc_awh, weth_awh } from '../../assets';
import { hydraDX, acala, moonbeam } from '../../chains';
import {
  BalanceBuilder,
  ContractBuilder,
  ExtrinsicBuilder,
} from '../../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: dai_awh,
    balance: BalanceBuilder().evm().erc20(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.002926334210356268,
      asset: dai_awh,
      balance: BalanceBuilder().evm().erc20(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: aca,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: wbtc_awh,
    balance: BalanceBuilder().evm().erc20(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.00000006,
      asset: wbtc_awh,
      balance: BalanceBuilder().evm().erc20(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: aca,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: weth_awh,
    balance: BalanceBuilder().evm().erc20(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.000000956965470918,
      asset: weth_awh,
      balance: BalanceBuilder().evm().erc20(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: aca,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toHydraDXViaWormhole: AssetConfig[] = [
  new AssetConfig({
    asset: dai_awh,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().TokenBridge().transferTokensWithPayload().mrl(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.08,
      asset: glmr,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: aca,
      balance: BalanceBuilder().evm().native(),
    },
    via: moonbeam,
  }),
];

export const acalaConfig = new ChainConfig({
  assets: [...toHydraDX, ...toHydraDXViaWormhole],
  chain: acala,
});
