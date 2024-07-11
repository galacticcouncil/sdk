import {
  big,
  ContractConfig,
  ContractConfigBuilder,
  Parachain,
  Precompile,
} from '@galacticcouncil/xcm-core';
import { isString } from '@polkadot/util';

import {
  getDestinationMultilocation,
  formatAssetIdToERC20,
} from './Xtokens.utils';

const U_64_MAX = 18446744073709551615n;

export function Xtokens() {
  return {
    transfer: (weight = U_64_MAX): ContractConfigBuilder => ({
      build: ({ address, amount, asset, destination, source }) => {
        const assetId = source.getAssetId(asset);
        return new ContractConfig({
          address: Precompile.Xtokens,
          args: [
            isString(assetId) ? formatAssetIdToERC20(assetId) : asset,
            amount,
            getDestinationMultilocation(address, destination as Parachain),
            weight,
          ],
          func: 'transfer',
          module: 'Xtokens',
        });
      },
    }),
    transferMultiCurrencies: (weight = U_64_MAX): ContractConfigBuilder => ({
      build: ({ address, amount, asset, destination, fee, source }) => {
        const assetId = source.getAssetId(asset);
        const feeAssetId = source.getAssetId(fee);
        const feeAmount = big.toBigInt(fee.amount, fee.decimals!);
        return new ContractConfig({
          address: Precompile.Xtokens,
          args: [
            [
              [
                isString(assetId) ? formatAssetIdToERC20(assetId) : assetId,
                amount,
              ],
              [
                isString(feeAssetId)
                  ? formatAssetIdToERC20(feeAssetId)
                  : feeAssetId,
                feeAmount,
              ],
            ],
            1,
            getDestinationMultilocation(address, destination as Parachain),
            weight,
          ],
          func: 'transferMultiCurrencies',
          module: 'Xtokens',
        });
      },
    }),
  };
}
