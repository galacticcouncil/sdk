import { Asset, Parachain } from '@galacticcouncil/xcm-core';

import type {
  PalletAssetsAssetAccount,
  PalletAssetsAssetDetails,
  XcmVersionedAssets,
} from '@polkadot/types/lookup';
import { Option, Result } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';

import { BN } from '@polkadot/util';
import { xxhashAsHex } from '@polkadot/util-crypto';

import { BaseClient } from '../base';

export class AssethubClient extends BaseClient {
  constructor(chain: Parachain) {
    super(chain);
  }

  async checkIfSufficient(asset: Asset): Promise<boolean> {
    const api = await this.chain.api;
    const assetId = this.chain.getAssetId(asset);
    const response =
      await api.query.assetRegistry.asset<Option<PalletAssetsAssetDetails>>(
        assetId
      );
    if (response.isEmpty) {
      return true;
    }
    const details = response.unwrap();
    return details.isSufficient.isTrue;
  }

  async checkIfFrozen(address: string, asset: Asset): Promise<boolean> {
    const api = await this.chain.api;
    const assetId = this.chain.getAssetId(asset);

    // If no internal ID (foreign asset) skip
    if (assetId === asset.originSymbol) {
      return false;
    }

    const response = await api.query.assets.account<
      Option<PalletAssetsAssetAccount>
    >(assetId, address);
    if (response.isEmpty) {
      return false;
    }
    const details = response.unwrap();
    return details.status.isFrozen;
  }

  async getAssetMin(asset: Asset): Promise<bigint> {
    const api = await this.chain.api;
    const assetId = this.chain.getAssetId(asset);
    const response =
      await api.query.assets.asset<Option<PalletAssetsAssetDetails>>(assetId);
    const details = response.unwrap();
    return details.minBalance.toBigInt();
  }

  async getBridgeDeliveryFee(
    options = {
      defaultFee: 2_750_872_500_000n,
    }
  ): Promise<bigint> {
    const api = await this.chain.api;
    const feeStorageKey = xxhashAsHex(':BridgeHubEthereumBaseFee:', 128, true);
    const feeStorageItem = await api.rpc.state.getStorage(feeStorageKey);
    const leFee = new BN(
      (feeStorageItem as Codec).toHex().replace('0x', ''),
      'hex',
      'le'
    );

    if (leFee.eqn(0)) {
      return options.defaultFee;
    }
    return BigInt(leFee.toString());
  }

  async calculateDeliveryFee(xcm: any, destParachainId: number) {
    return 360_000_000n;

    // TEMP fix

    const api = await this.chain.api;
    const result = await api.call.xcmPaymentApi.queryDeliveryFees<
      Result<XcmVersionedAssets, any>
    >(
      {
        V4: {
          parents: 1,
          interior: { X1: [{ parachain: destParachainId }] },
        },
      },
      xcm
    );

    if (!result.isOk) {
      throw Error(`Can't query XCM delivery fee.`);
    }

    for (const asset of result.asOk.asV4) {
      if (asset.id.parents.toNumber() === 1 && asset.id.interior.isHere) {
        return asset.fun.asFungible.toBigInt();
      }
    }
    throw Error(`Can't find XCM delivery fee in DOT.`);
  }
}
