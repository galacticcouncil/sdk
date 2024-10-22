import { Asset, Parachain } from '@galacticcouncil/xcm-core';

import type {
  PalletAssetsAssetAccount,
  PalletAssetsAssetDetails,
} from '@polkadot/types/lookup';
import { Option } from '@polkadot/types';

import { BalanceClient } from '../balance';

export class HubClient extends BalanceClient {
  constructor(chain: Parachain) {
    super(chain);
  }

  async checkIfFrozen(address: string, asset: Asset): Promise<boolean> {
    const api = await this.chain.api;
    const assetId = this.chain.getAssetId(asset);
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
}
