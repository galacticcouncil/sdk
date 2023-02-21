import type { AssetMetadata } from '@polkadot/types/interfaces';
import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import { ApiPromise, ApiRx } from '@polkadot/api';
import { Storage } from '../../storage';
import { Asset } from '../../types';
import { firstValueFrom } from 'rxjs';
import { AssetProvider } from './AssetProvider';

interface AssetDetail {
  readonly name: string;
  readonly assetType: string;
  readonly existentialDeposit: number;
  readonly locked: boolean;
}

const createStorages = (api: ApiPromise | ApiRx) => {
  return {
    assetMetadata: () =>
      Storage.create<[StorageKey<AnyTuple>, Codec][]>({
        api,
        path: 'query.assetRegistry.assetMetadataMap.entries',
        params: [],
      }),
    assets: () =>
      Storage.create<[StorageKey<AnyTuple>, Codec][]>({
        api,
        path: 'query.assetRegistry.assets.entries',
        params: [],
      }),
  };
};

export class HydradxAssetProvider implements AssetProvider {
  private api: ApiPromise | ApiRx;

  constructor(api: ApiPromise | ApiRx) {
    this.api = api;
  }

  async getAssets(): Promise<Record<string, Asset>> {
    const storages = createStorages(this.api);
    const metadata = await firstValueFrom(storages.assetMetadata().observable);
    const assets = await firstValueFrom(storages.assets().observable);

    const assetDetails = assets.map((asset: [StorageKey<AnyTuple>, Codec]) => this.toAssetDetail(asset));
    const assetMetadata = metadata.map((metadata: [StorageKey<AnyTuple>, Codec]) => this.toAssetMetadata(metadata));

    const result: Record<string, Asset> = {};
    for (let i = 0; i < assetMetadata.length; i++) {
      const symbol = assetMetadata[i].symbol.toUpperCase();
      const data = {
        ...assetMetadata[i],
        ...assetDetails.find((item) => item.id === assetMetadata[i].id),
      };
      result[symbol] = data;
    }
    return result;
  }

  private toAssetDetail(asset: [StorageKey<AnyTuple>, Codec]) {
    const id = (asset[0].toHuman() as string[])[0];
    const assetHuman = asset[1].toJSON() as unknown as AssetDetail;
    return {
      id: id,
      ed: Number(assetHuman.existentialDeposit),
    } as Asset;
  }

  private toAssetMetadata(metadata: [StorageKey<AnyTuple>, Codec]) {
    const id = (metadata[0].toHuman() as string[])[0];
    const assetHuman = metadata[1].toHuman() as unknown as AssetMetadata;
    return {
      id: id,
      symbol: assetHuman.symbol.toString(),
      decimals: Number(assetHuman.decimals.toString()),
    } as Asset;
  }
}
