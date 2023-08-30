import { BalanceBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-config';

import { daiAcala } from '../assets';
import { hydraDX, acala } from '../chains';
import { ExtrinsicBuilderV3 } from '../builders';

const toEvmAddress = async (api: any, address: string) => {
  const h160Addr = await api.query.evmAccounts.evmAddresses(address);
  return h160Addr.toString();
};

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: daiAcala,
    balance: BalanceBuilder().evm().erc20(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.002926334210356268,
      asset: daiAcala,
      balance: BalanceBuilder().evm().erc20(),
    },
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
    toEvmAddress: toEvmAddress,
  }),
];

export const acalaConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: acala,
});
