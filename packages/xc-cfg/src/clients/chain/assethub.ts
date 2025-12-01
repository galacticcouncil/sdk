import { Asset, Parachain } from '@galacticcouncil/xc-core';

import { Twox128 } from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';

import { BaseClient } from '../base';
import { LocationEncoder } from '../../utils/multilocation-encoder';

export class AssethubClient extends BaseClient {
  constructor(chain: Parachain) {
    super(chain);
  }

  async checkIfSufficient(asset: Asset): Promise<boolean> {
    const client = this.chain.api;
    const api = client.getUnsafeApi();
    const assetId = this.chain.getAssetId(asset);
    const assetLocation = this.chain.getAssetXcmLocation(asset);

    if (assetId === 0) {
      return true;
    }

    const response =
      assetId === asset.originSymbol
        ? await api.query.ForeignAssets.Asset.getValue(assetLocation)
        : await api.query.Assets.Asset.getValue(Number(assetId));

    if (response) {
      return response.is_sufficient || false;
    }

    return false;
  }

  async checkIfFrozen(address: string, asset: Asset): Promise<boolean> {
    const client = this.chain.api;
    const api = client.getUnsafeApi();
    const assetId = this.chain.getAssetId(asset);

    // If no internal ID (foreign asset) skip
    if (assetId === asset.originSymbol) {
      return false;
    }

    const response = await api.query.Assets.Account.getValue(assetId, address);
    if (!response) {
      return false;
    }
    return response.status?.Frozen || false;
  }

  async getAssetMin(asset: Asset): Promise<bigint> {
    const client = this.chain.api;
    const api = client.getUnsafeApi();
    const assetId = this.chain.getAssetId(asset);
    const response = await api.query.Assets.Asset.getValue(assetId);
    return BigInt(response.min_balance);
  }

  async getBridgeDeliveryFee(
    options = {
      defaultFee: 2_750_872_500_000n,
    }
  ): Promise<bigint> {
    const client = this.chain.api;
    const keyBytes = new TextEncoder().encode(':BridgeHubEthereumBaseFee:');
    const feeStorageKey = toHex(Twox128(keyBytes));
    const feeStorageItem = await client._request<string>('state_getStorage', [
      feeStorageKey,
    ]);

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

  async calculateDeliveryFee(xcm: any, destParachainId: number) {
    const client = this.chain.api;
    const api = client.getUnsafeApi();

    const destination = {
      type: 'V4',
      value: {
        parents: 1,
        interior: {
          type: 'X1',
          value: {
            type: 'Parachain',
            value: destParachainId,
          },
        },
      },
    };

    const result = await api.apis.XcmPaymentApi.query_delivery_fees(
      destination,
      xcm
    );

    if (!result.success) {
      throw Error(`Can't query XCM delivery fee.`);
    }

    const assets = result.value.value || result.value.V4 || result.value;
    for (const asset of assets) {
      const interior = asset.id.interior;
      const isHere =
        interior?.type === 'Here' ||
        interior === 'Here' ||
        interior === undefined;
      if (asset.id.parents === 1 && isHere) {
        return BigInt(asset.fun.value ?? asset.fun.Fungible);
      }
    }
    throw Error(`Can't find XCM delivery fee in DOT.`);
  }

  async calculateDestinationFee(xcm: any, asset: Asset): Promise<bigint> {
    try {
      const client = this.chain.api;
      const api = client.getUnsafeApi();

      const weight = await api.apis.XcmPaymentApi.query_xcm_weight(xcm);

      if (!weight.success) {
        throw Error(`Can't query XCM weight.`);
      }

      const feeAssetLocation = this.chain.getAssetXcmLocation(asset);
      if (!feeAssetLocation) {
        throw Error(`Can't get XCM location for asset ${asset.originSymbol}`);
      }

      const encodedLocation = LocationEncoder.encode(feeAssetLocation);
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
