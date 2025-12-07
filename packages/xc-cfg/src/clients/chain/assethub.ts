import { Asset, Parachain } from '@galacticcouncil/xc-core';
import {
  hub,
  XcmV5Junctions,
  XcmV5Junction,
  XcmVersionedLocation,
  XcmVersionedXcm,
} from '@galacticcouncil/descriptors';
import { encodeLocation } from '@galacticcouncil/common';

import { Twox128 } from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';

import { BaseClient } from '../base';

export class AssethubClient extends BaseClient<typeof hub> {
  constructor(chain: Parachain) {
    super(chain);
  }

  async checkIfSufficient(asset: Asset): Promise<boolean> {
    const assetId = this.chain.getAssetId(asset);
    const assetLocation = this.chain.getAssetXcmLocation(asset);
    const encodedLocation = encodeLocation(assetLocation);

    if (assetId === 0) {
      return true;
    }

    const response =
      assetId === asset.originSymbol
        ? await this.api().query.ForeignAssets.Asset.getValue(encodedLocation)
        : await this.api().query.Assets.Asset.getValue(Number(assetId));

    if (response) {
      return response.is_sufficient || false;
    }

    return false;
  }

  async checkIfFrozen(address: string, asset: Asset): Promise<boolean> {
    const assetId = this.chain.getAssetId(asset);

    // If no internal ID (foreign asset) skip
    if (assetId === asset.originSymbol) {
      return false;
    }

    const response = await this.api().query.Assets.Account.getValue(
      Number(assetId),
      address
    );
    if (!response) {
      return false;
    }
    return response.status.type === 'Frozen' || false;
  }

  async getAssetMin(asset: Asset): Promise<bigint> {
    const assetId = this.chain.getAssetId(asset);
    const response = await this.api().query.Assets.Asset.getValue(
      Number(assetId)
    );
    return response?.min_balance || 0n;
  }

  async getBridgeDeliveryFee(
    options = {
      defaultFee: 2_750_872_500_000n,
    }
  ): Promise<bigint> {
    const keyBytes = new TextEncoder().encode(':BridgeHubEthereumBaseFee:');
    const feeStorageKey = toHex(Twox128(keyBytes));
    const feeStorageItem = await this.client._request<string>(
      'state_getStorage',
      [feeStorageKey]
    );

    if (!feeStorageItem) {
      return options.defaultFee;
    }

    // Parse little-endian hex to BigInt
    const hexValue = feeStorageItem.replace('0x', '');
    const bytes = new Uint8Array(
      hexValue.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
    let leFee = 0n;
    for (let i = 0; i < bytes.length; i++) {
      leFee |= BigInt(bytes[i]) << BigInt(i * 8);
    }

    if (leFee === 0n) {
      return options.defaultFee;
    }
    return leFee;
  }

  async calculateDeliveryFee(
    xcm: XcmVersionedXcm,
    destParachainId: number
  ): Promise<bigint> {
    const destination = XcmVersionedLocation.V5({
      parents: 1,
      interior: XcmV5Junctions.X1(XcmV5Junction.Parachain(destParachainId)),
    });

    const result = await this.api().apis.XcmPaymentApi.query_delivery_fees(
      destination,
      xcm
    );

    if (!result.success) {
      throw Error(`Can't query XCM delivery fee.`);
    }

    const dotAsset = result.value.value.find((a) => {
      const id = a.id as any;
      return id && id.parents && id.parents === 1 && 'Here' in id.interior;
    });

    if (!dotAsset) {
      throw Error(`Can't find XCM delivery fee in DOT.`);
    }

    const val = dotAsset.fun.value;
    if (typeof val === 'bigint') {
      return val;
    }
    throw Error(`Can't parse delivery fee.`);
  }
}
