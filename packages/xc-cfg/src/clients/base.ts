import { ChainDefinition, TypedApi } from 'polkadot-api';

import { Asset, Parachain } from '@galacticcouncil/xc-core';
import { encodeLocation } from '@galacticcouncil/common';
import {
  hub,
  Hub,
  XcmV4Instruction,
  XcmVersionedAssetId,
} from '@galacticcouncil/descriptors';

export class BaseClient<C extends ChainDefinition = typeof hub> {
  readonly chain: Parachain;
  readonly descriptor: C;

  constructor(chain: Parachain, descriptor?: C) {
    this.chain = chain;
    this.descriptor = descriptor ?? (hub as C);
  }

  get client() {
    return this.chain.client;
  }

  get unsafeApi() {
    return this.client.getUnsafeApi();
  }

  api(): TypedApi<C> {
    return this.client.getTypedApi(this.descriptor);
  }

  async getSystemAccountBalance(address: string): Promise<bigint> {
    const response =
      await this.unsafeApi.query.System.Account.getValue(address);
    const balance = response.data;
    const { free, frozen } = balance;
    return BigInt(free) - BigInt(frozen);
  }

  async calculateDestinationFee(
    xcm: XcmV4Instruction[],
    asset: Asset
  ): Promise<bigint> {
    const weight = await this.unsafeApi.apis.XcmPaymentApi.query_xcm_weight({
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
      await this.unsafeApi.apis.XcmPaymentApi.query_weight_to_asset_fee(
        weight.value,
        XcmVersionedAssetId.V4(encodedLocation)
      );

    if (!feeInAsset.success) {
      throw Error(`Can't convert weight to fee in ${asset.originSymbol}`);
    }

    return BigInt(feeInAsset.value);
  }
}
