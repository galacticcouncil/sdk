import { Asset, Parachain } from '@galacticcouncil/xc-core';
import {
  hydration,
  XcmV4Instruction,
  XcmVersionedAssetId,
} from '@galacticcouncil/descriptors';

import { BaseClient } from '../base';
import { encodeLocation } from '@galacticcouncil/common';

export class HydrationClient extends BaseClient<typeof hydration> {
  constructor(chain: Parachain) {
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

  async calculateDestinationFee(
    xcm: XcmV4Instruction[],
    asset: Asset
  ): Promise<bigint> {
    console.log(this.chain);
    const weight = await this.api().apis.XcmPaymentApi.query_xcm_weight({
      type: 'V4',
      value: xcm,
    });

    if (!weight.success) {
      throw Error(`Can't query XCM weight.`);
    }

    const feeAssetLocation = this.chain.getAssetXcmLocation(asset);
    if (!feeAssetLocation) {
      throw Error(`Can't get XCM location for asset ${asset.originSymbol}`);
    }

    const encodedLocation = encodeLocation(feeAssetLocation);

    const feeInAsset =
      await this.api().apis.XcmPaymentApi.query_weight_to_asset_fee(
        weight.value,
        XcmVersionedAssetId.V4(encodedLocation)
      );

    if (!feeInAsset.success) {
      throw Error(`Can't convert weight to fee in ${asset.originSymbol}`);
    }

    return BigInt(feeInAsset.value);
  }
}
