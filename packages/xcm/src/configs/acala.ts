import { BalanceBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';

import { dai_awh, wbtc_awh, weth_awh } from '../assets';
import { hydraDX, acala } from '../chains';
import { ExtrinsicBuilderV3 } from '../builders';

const toEvmAddress = async (api: any, address: string) => {
  const h160Addr = await api.query.evmAccounts.evmAddresses(address);
  return h160Addr.toString();
};

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
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
    //toEvmAddress,
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
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
    //toEvmAddress,
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
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
    //toEvmAddress,
  }),
];

export const acalaConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: acala,
});
