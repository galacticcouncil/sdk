import { Asset, AnyParachain } from '@galacticcouncil/xc-core';
import { hydration } from '@galacticcouncil/descriptors';

import { BaseClient } from '../../base';

import {
  AssetDepositLimit,
  GlobalWithdrawLimit,
  getAllAssetDepositLimits,
  getAssetDepositLimit,
  getGlobalWithdrawLimit,
} from './circuit-breaker';

export class HydrationClient extends BaseClient<typeof hydration> {
  constructor(chain: AnyParachain) {
    super(chain, hydration);
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

  async getAssetBalance(address: string, asset: string): Promise<bigint> {
    if (asset === '0') {
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

  getAssetDepositLimit(assetOrId: Asset | number): Promise<AssetDepositLimit> {
    const assetId =
      typeof assetOrId === 'number'
        ? assetOrId
        : Number(this.chain.getAssetId(assetOrId));
    return getAssetDepositLimit(this.api(), assetId);
  }

  getAllAssetDepositLimits(): Promise<Map<string, AssetDepositLimit>> {
    return getAllAssetDepositLimits(this.api());
  }

  getGlobalWithdrawLimit(): Promise<GlobalWithdrawLimit> {
    return getGlobalWithdrawLimit(this.api());
  }
}
