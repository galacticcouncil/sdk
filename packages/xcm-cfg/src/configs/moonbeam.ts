import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import {
  dai_mwh,
  glmr,
  hdx,
  usdc_mwh,
  usdt_mwh,
  wbtc_mwh,
  weth_mwh,
  dot,
  usdt,
  usdc,
  pink,
} from '../assets';
import { acala, assetHub, hydraDX, moonbeam } from '../chains';
import { BalanceBuilder, ContractBuilder } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: glmr,
    balance: BalanceBuilder().substrate().system().account(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.05,
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
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
    asset: dai_mwh,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.004,
      asset: dai_mwh,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: usdc_mwh,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.004,
      asset: usdc_mwh,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: usdt_mwh,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.004,
      asset: usdt_mwh,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: wbtc_mwh,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.0000001,
      asset: wbtc_mwh,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: weth_mwh,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.000002,
      asset: weth_mwh,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().assets().account(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.1,
      asset: dot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  // TODO: Uncomment with asset hub release 1.7 (jit_withdraw fix)
  // new AssetConfig({
  //   asset: usdt,
  //   balance: BalanceBuilder().substrate().assets().account(),
  //   contract: ContractBuilder().Xtokens().transfer(),
  //   destination: hydraDX,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdt,
  //     balance: BalanceBuilder().substrate().tokens().accounts(),
  //   },
  //   fee: {
  //     asset: glmr,
  //     balance: BalanceBuilder().substrate().system().account(),
  //   },
  // }),
  // new AssetConfig({
  //   asset: usdc,
  //   balance: BalanceBuilder().substrate().assets().account(),
  //   contract: ContractBuilder().Xtokens().transfer(),
  //   destination: hydraDX,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdc,
  //     balance: BalanceBuilder().substrate().tokens().accounts(),
  //   },
  //   fee: {
  //     asset: glmr,
  //     balance: BalanceBuilder().substrate().system().account(),
  //   },
  // }),
];
const toAssetHub: AssetConfig[] = [
  new AssetConfig({
    asset: pink,
    balance: BalanceBuilder().substrate().assets().account(),
    contract: ContractBuilder().Xtokens().transferMultiCurrencies(),
    destination: assetHub,
    destinationFee: {
      amount: 0.18,
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().assets().account(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: assetHub,
    destinationFee: {
      amount: 0.18,
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: usdc,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().Xtokens().transfer(),
    destination: assetHub,
    destinationFee: {
      amount: 0.18,
      asset: usdc,
      balance: BalanceBuilder().substrate().assets().account(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toAcalaViaWormhole: AssetConfig[] = [
  /*  new AssetConfig({
    asset: dai_mwh,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder().TokenBridge().transferTokens(),
    destination: acala,
    destinationFee: {
      amount: 0.004,
      asset: dai_mwh,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }), */
  new AssetConfig({
    asset: dai_mwh,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilder()
      .Batch()
      .batchAll([
        ContractBuilder().Erc20().approve(),
        ContractBuilder().TokenBridge().transferTokens(),
      ]),
    destination: acala,
    destinationFee: {
      amount: 0.004,
      asset: dai_mwh,
      balance: BalanceBuilder().evm().erc20(),
    },
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

export const moonbeamConfig = new ChainConfig({
  assets: [...toHydraDX, ...toAssetHub, ...toAcalaViaWormhole],
  chain: moonbeam,
});
