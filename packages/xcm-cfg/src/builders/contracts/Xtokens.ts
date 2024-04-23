import {
  ContractConfig,
  ContractConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { formatAssetIdToERC20 } from '@moonbeam-network/xcm-utils';
import { isString } from '@polkadot/util';

import { getDestinationMultilocation } from './Xtokens.utils';

const U_64_MAX = 18446744073709551615n;

export function Xtokens() {
  return {
    transfer: (weight = U_64_MAX): ContractConfigBuilder => ({
      build: ({ address, amount, asset, destination, source }) => {
        const assetId = source.getAssetId(asset);
        return new ContractConfig({
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
        return new ContractConfig({
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
                fee,
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
