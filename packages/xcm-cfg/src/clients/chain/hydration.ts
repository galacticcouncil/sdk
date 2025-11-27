import { Asset, Parachain } from '@galacticcouncil/xcm-core';

import type { PalletAssetRegistryAssetDetails } from '@polkadot/types/lookup';
import { Option } from '@polkadot/types';

import { BaseClient } from '../base';

export class HydrationClient extends BaseClient {
  constructor(chain: Parachain) {
    super(chain);
  }

  async checkIfSufficient(asset: Asset): Promise<boolean> {
    const api = await this.chain.api;
    const assetId = this.chain.getAssetId(asset);
    const response =
      await api.query.assetRegistry.assets<
        Option<PalletAssetRegistryAssetDetails>
      >(assetId);
    if (response.isEmpty) {
      return true;
    }
    const details = response.unwrap();
    return details.isSufficient.isTrue;
  }

  async getFeeAsset(address: string): Promise<string> {
    const api = await this.chain.api;
    const response =
      await api.query.multiTransactionPayment.accountCurrencyMap(address);
    if (response.isEmpty) {
      return '0';
    }
    const asset = response.unwrap();
    return asset.toString();
  }

  async getAssetBalance(address: string, asset: string): Promise<bigint> {
    if (asset === '0') {
      return this.getSystemAccountBalance(address);
    }
    return this.getTokensAccountsBalance(address, asset);
  }
}
