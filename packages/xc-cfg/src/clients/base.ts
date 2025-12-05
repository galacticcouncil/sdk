import { Asset, Parachain } from '@galacticcouncil/xc-core';
import { encodeAssetId, encodeLocation } from '@galacticcouncil/common';

import { getTypedApi } from '../utils/papi';

export class BaseClient {
  readonly chain: Parachain;

  constructor(chain: Parachain) {
    this.chain = chain;
  }

  async getSystemAccountBalance(address: string): Promise<bigint> {
    const client = this.chain.api;
    const api = getTypedApi(client);

    const response = await api.query.System.Account.getValue(address);
    const balance = response.data;
    const { free, frozen } = balance;
    return BigInt(free) - BigInt(frozen);
  }

  async getTokensAccountsBalance(address: string, asset: any): Promise<bigint> {
    const client = this.chain.api;
    const api = getTypedApi(client);

    const assetId = encodeAssetId(asset);

    const response = await api.query.Tokens.Accounts.getValue(address, assetId);
    const { free, frozen } = response;
    return BigInt(free) - BigInt(frozen);
  }

  async calculateDestinationFee(xcm: any, asset: Asset): Promise<bigint> {
    try {
      const client = this.chain.api;
      const api = client.getUnsafeApi();

      const versionedXcm = xcm.value?.custom_xcm_on_dest || xcm;

      const weight =
        await api.apis.XcmPaymentApi.query_xcm_weight(versionedXcm);
      if (!weight.success) {
        throw Error(`Can't query XCM weight.`);
      }

      const feeAssetLocation = this.chain.getAssetXcmLocation(asset);
      if (!feeAssetLocation) {
        throw Error(`Can't get XCM location for asset ${asset.originSymbol}`);
      }

      const encodedLocation = encodeLocation(feeAssetLocation);
      const versionedAssetId = {
        type: 'V4',
        value: encodedLocation,
      };

      const feeInAsset = await api.apis.XcmPaymentApi.query_weight_to_asset_fee(
        weight.value,
        versionedAssetId
      );

      if (!feeInAsset.success) {
        throw Error(`Can't convert weight to fee in ${asset.originSymbol}`);
      }

      return BigInt(feeInAsset.value);
    } catch (error) {
      console.error('Error in calculateDestinationFee:', error);
      throw error;
    }
  }
}
