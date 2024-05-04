import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { aca, dai_awh, wbtc_awh, weth_awh } from '../../assets';
import { hydraDX, acala } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

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

export const acalaConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: acala,
});
