import { Asset, Parachain } from '@galacticcouncil/xc-core';

import { BaseClient } from '../base';
import { getTypedApi } from '../../utils/papi';

export class HydrationClient extends BaseClient {
  constructor(chain: Parachain) {
    super(chain);
  }

  async checkIfSufficient(asset: Asset): Promise<boolean> {
    const client = this.chain.api;
    const api = getTypedApi(client);
    const assetId = this.chain.getAssetId(asset);
    const assetIdNum = Number(assetId);
    const response = await api.query.AssetRegistry.Assets.getValue(assetIdNum);

    if (!response) {
      return true;
    }
    return response.is_sufficient || false;
  }

  async getFeeAsset(address: string): Promise<string> {
    const client = this.chain.api;
    const api = getTypedApi(client);
    const response =
      await api.query.MultiTransactionPayment.AccountCurrencyMap.getValue(
        address
      );

    if (!response) {
      return '0';
    }
    return response.toString();
  }

  async getAssetBalance(address: string, asset: any): Promise<bigint> {
    if (asset === '0' || asset === 0) {
      return this.getSystemAccountBalance(address);
    }
    return this.getTokensAccountsBalance(address, asset);
  }
}
