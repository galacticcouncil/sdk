import { Wormhole } from '@galacticcouncil/xcm-core';
import { BalanceBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';

import {
  dai_mwh,
  eth,
  glmr,
  usdc_mwh,
  usdt_mwh,
  wbtc_mwh,
  weth_mwh,
} from '../assets';
import { ethereumMrl, hydraDX } from '../chains';
import { BalanceBuilderV2, ContractBuilderV2 } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: dai_mwh,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilderV2().Bridge().mrlViaWormhole(Wormhole.Ethereum),
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

export const ethereumMrlConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: ethereumMrl,
});
