import { Asset, Parachain } from '@galacticcouncil/xcm-core';

import { Twox128 } from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';

import { BaseClient } from '../base';

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
    const result = await api.apis.XcmPaymentApi.query_delivery_fees(
      {
        V4: {
          parents: 1,
          interior: { X1: [{ parachain: destParachainId }] },
        },
      },
      xcm
    );

    if (!result.success) {
      throw Error(`Can't query XCM delivery fee.`);
    }

    const assets = result.value.V4 || result.value;
    for (const asset of assets) {
      if (asset.id.parents === 1 && asset.id.interior?.type === 'Here') {
        return BigInt(asset.fun.Fungible);
      }
    }
    throw Error(`Can't find XCM delivery fee in DOT.`);
  }
}
