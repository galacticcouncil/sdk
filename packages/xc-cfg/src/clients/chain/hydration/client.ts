import { Asset, AnyParachain } from '@galacticcouncil/xc-core';
import { h160 } from '@galacticcouncil/common';
import { hydration } from '@galacticcouncil/descriptors';

import { weth_wh } from '../../../assets';
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

  /**
   * Fee currency of an account, as the runtime resolves it.
   *
   * - Keyed by the substrate account, an h160 resolves to its own
   * - Without an entry, evm (truncated h160) accounts pay in weth, the
   *   rest in hdx (`0`)
   *
   * @param address - ss58 or h160
   */
  async getFeeAsset(address: string): Promise<string> {
    const account = this.chain.getNormalizedAddress(address);
    const response =
      await this.api().query.MultiTransactionPayment.AccountCurrencyMap.getValue(
        account
      );

    if (response !== undefined) {
      return response.toString();
    }
    return h160.isEvmAccount(account)
      ? this.chain.getAssetId(weth_wh).toString()
      : '0';
  }

  async getAssetBalance(address: string, asset: string): Promise<bigint> {
    if (asset === '0') {
      return this.getSystemAccountBalance(address);
    }
    return this.getTokensAccountsBalance(address, asset);
  }

  async getSystemAccountBalance(address: string): Promise<bigint> {
    const response = await this.api().query.System.Account.getValue(
      this.chain.getNormalizedAddress(address)
    );
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
      this.chain.getNormalizedAddress(address),
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
