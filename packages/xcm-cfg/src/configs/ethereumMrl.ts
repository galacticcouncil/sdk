import { BalanceBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';

import { glmr, usdc_mwh, usdt_mwh, wbtc_mwh, weth_mwh } from '../assets';
import { ethereumMrl, hydraDX } from '../chains';
import { ContractBuilderV2 } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: weth_mwh,
    balance: BalanceBuilder().evm().erc20(),
    contract: ContractBuilderV2()
      .Bridge()
      .transferTokensWithPayload(
        16,
        '0x0000000000000000000000000000000000000000000000000000000000000816',
        hydraDX.parachainId
      ),
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
];

export const ethereumConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: ethereumMrl,
});
