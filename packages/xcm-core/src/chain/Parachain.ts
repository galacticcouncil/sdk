import { ApiPromise } from '@polkadot/api';

import { Asset } from '../asset';
import { SubstrateApis } from '../substrate';
import {
  Chain,
  ChainAssetData,
  ChainAssetId,
  ChainParams,
  ChainType,
} from './Chain';

/**
 * Parachain Asset Data
 *
 * @interface ParachainAssetsData
 * @member {ChainAssetId} metadataId asset "on chain" id
 * @member {AssetAmount} minId asset "on chain" id to fetch minimal deposit
 * @member {AssetAmount} palletInstance asset pallet instance (if any)
 */
export interface ParachainAssetsData extends ChainAssetData {
  metadataId?: ChainAssetId;
  minId?: ChainAssetId;
  palletInstance?: number;
}

export interface ParachainParams extends ChainParams<ParachainAssetsData> {
  explorer?: string;
  genesisHash: string;
  parachainId: number;
  ss58Format: number;
  usesH160Acc?: boolean;
  usesChainDecimals?: boolean;
  ws: string | string[];
}

export class Parachain extends Chain<ParachainAssetsData> {
  readonly explorer?: string;

  readonly genesisHash: string;

  readonly parachainId: number;

  readonly ss58Format: number;

  readonly usesChainDecimals: boolean;

  readonly usesH160Acc: boolean;

  readonly ws: string | string[];

  constructor({
    explorer,
    genesisHash,
    parachainId,
    usesChainDecimals,
    usesH160Acc = false,
    ss58Format,
    ws,
    ...others
  }: ParachainParams) {
    super({ ...others });
    this.explorer = explorer;
    this.genesisHash = genesisHash;
    this.parachainId = parachainId;
    this.ss58Format = ss58Format;
    this.usesChainDecimals = !!usesChainDecimals;
    this.usesH160Acc = usesH160Acc;
    this.ws = ws;
  }

  get api(): Promise<ApiPromise> {
    const pool = SubstrateApis.getInstance();
    return pool.api(this.ws);
  }

  getType(): ChainType {
    return ChainType.Parachain;
  }

  getAssetPalletInstance(asset: Asset): number | undefined {
    return this.assetsData.get(asset.key)?.palletInstance;
  }

  getMinAssetId(asset: Asset): ChainAssetId {
    return this.assetsData.get(asset.key)?.minId ?? this.getAssetId(asset);
  }

  getMetadataAssetId(asset: Asset): ChainAssetId {
    return this.assetsData.get(asset.key)?.metadataId ?? this.getAssetId(asset);
  }

  findAssetById(id: string) {
    return Array.from(this.assetsData.values()).find((a) => {
      return Object.hasOwn(a, 'metadataId')
        ? a.metadataId?.toString() === id
        : a.id?.toString() === id;
    });
  }
}
