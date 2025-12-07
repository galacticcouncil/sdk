import { Asset, Parachain } from '@galacticcouncil/xc-core';
import { hydration } from '@galacticcouncil/descriptors';

import { BaseClient } from '../base';

export class HydrationClient extends BaseClient<typeof hydration> {
  constructor(chain: Parachain) {
    super(chain);
  }

  get client() {
    return this.chain.client;
  }

  api() {
    return this.client.getTypedApi(hydration);
  }

  async checkIfSufficient(asset: Asset): Promise<boolean> {
    const assetId = this.chain.getAssetId(asset);
    const assetIdNum = Number(assetId);
    const response =
      await this.api().query.AssetRegistry.Assets.getValue(assetIdNum);

    if (!response) {
      return true;
    }
    return response.is_sufficient || false;
  }

  async getFeeAsset(address: string): Promise<string> {
    const response =
      await this.api().query.MultiTransactionPayment.AccountCurrencyMap.getValue(
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

  async getSystemAccountBalance(address: string): Promise<bigint> {
    const response = await this.api().query.System.Account.getValue(address);
    const balance = response.data;
    const { free, frozen } = balance;
    return BigInt(free) - BigInt(frozen);
  }

  async getTokensAccountsBalance(
    address: string,
    asset: string
  ): Promise<bigint> {
    const assetId = Number(asset);
    const response = await this.api().query.Tokens.Accounts.getValue(
      address,
      assetId
    );
    const { free, frozen } = response;
    return BigInt(free) - BigInt(frozen);
  }
}
