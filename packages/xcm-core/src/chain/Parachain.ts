import { ApiPromise } from '@polkadot/api';
import { AnyJson } from '@polkadot/types/types';

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
 * @member {ChainAssetId} metadataId asset id to query metadata (if other than internal)
 * @member {ChainAssetId} minId asset id to query minimal deposit (if other than internal)
 * @member {Record<string, AnyJson>} xcmLocation asset xcm location
 */
export interface ParachainAssetData extends ChainAssetData {
  metadataId?: ChainAssetId;
  minId?: ChainAssetId;
  xcmLocation?: Record<string, AnyJson>;
}

export interface ParachainParams extends ChainParams<ParachainAssetData> {
  explorer?: string;
  genesisHash: string;
  parachainId: number;
  ss58Format: number;
  usesH160Acc?: boolean;
  usesChainDecimals?: boolean;
  ws: string | string[];
}

export class Parachain extends Chain<ParachainAssetData> {
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

  getAssetXcmLocation(asset: Asset): Record<string, AnyJson> | undefined {
    return this.assetsData.get(asset.key)?.xcmLocation;
  }

  getMetadataAssetId(asset: Asset): ChainAssetId {
    return this.assetsData.get(asset.key)?.metadataId ?? this.getAssetId(asset);
  }

  getMinAssetId(asset: Asset): ChainAssetId {
    return this.assetsData.get(asset.key)?.minId ?? this.getAssetId(asset);
  }

  findAssetById(id: string) {
    return Array.from(this.assetsData.values()).find((a) => {
      return Object.hasOwn(a, 'metadataId')
        ? a.metadataId?.toString() === id
        : a.id?.toString() === id;
    });
  }
}
