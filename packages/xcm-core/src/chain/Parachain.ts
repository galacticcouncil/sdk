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

export interface ParachainAssetsData extends ChainAssetData {
  metadataId?: ChainAssetId;
  minId?: ChainAssetId;
  palletInstance?: number;
}

export interface ParachainParams extends ChainParams<ParachainAssetsData> {
  genesisHash: string;
  parachainId: number;
  ss58Format: number;
  usesChainDecimals?: boolean;
  weight?: number;
  ws: string | string[];
  h160AccOnly?: boolean;
}

export class Parachain extends Chain<ParachainAssetsData> {
  readonly genesisHash: string;

  readonly parachainId: number;

  readonly ss58Format: number;

  readonly usesChainDecimals: boolean;

  readonly weight?: number;

  readonly ws: string | string[];

  readonly h160AccOnly: boolean;

  constructor({
    genesisHash,
    parachainId,
    usesChainDecimals,
    ss58Format,
    weight,
    ws,
    h160AccOnly = false,
    ...others
  }: ParachainParams) {
    super({ ...others });
    this.genesisHash = genesisHash;
    this.parachainId = parachainId;
    this.ss58Format = ss58Format;
    this.usesChainDecimals = !!usesChainDecimals;
    this.weight = weight;
    this.ws = ws;
    this.h160AccOnly = h160AccOnly;
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
}
