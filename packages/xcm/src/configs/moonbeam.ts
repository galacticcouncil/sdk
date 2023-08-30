import { BalanceBuilder, ContractBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-config';

import { daiMoonbeam, glmr, hdx, wbtc, weth } from '../assets';
import { hydraDX, moonbeam } from '../chains';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: hdx,
    balance: BalanceBuilder().substrate().assets().account(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.6,
      asset: hdx,
      balance: BalanceBuilder().substrate().assets().account(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: daiMoonbeam,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.004,
      asset: daiMoonbeam,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: wbtc,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.0000001,
      asset: wbtc,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: weth,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.000002,
      asset: weth,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

export const moonbeamConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: moonbeam,
});
