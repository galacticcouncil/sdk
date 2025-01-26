import { Asset, Parachain } from '@galacticcouncil/xcm-core';

import type {
  PalletAssetsAssetAccount,
  PalletAssetsAssetDetails,
} from '@polkadot/types/lookup';
import { Option } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';
import { BN } from '@polkadot/util';
import { xxhashAsHex } from '@polkadot/util-crypto';

import { BalanceClient } from '../balance';

export class AssethubClient extends BalanceClient {
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

  async getBridgeFee(
    options = {
      executionFee: 3_500_000_000n,
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
    const bridgeFee = BigInt(leFee.toString());
    return bridgeFee + options.executionFee;
  }
}
