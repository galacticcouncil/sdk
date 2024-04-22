import { Asset } from '@moonbeam-network/xcm-types';
import {
  Chain,
  ChainAssetData,
  ChainAssetId,
  ChainParams,
  ChainType,
} from './Chain';

export interface ParachainAssetsData extends ChainAssetData {
  balanceId?: ChainAssetId;
  metadataId?: ChainAssetId;
  minId?: ChainAssetId;
  palletInstance?: number;
  min?: number;
}

export interface ParachainParams extends ChainParams<ParachainAssetsData> {
  genesisHash: string;
  parachainId: number;
  ss58Format: number;
  usesChainDecimals?: boolean;
  weight?: number;
  ws: string;
}

export class Parachain extends Chain<ParachainAssetsData> {
  readonly genesisHash: string;

  readonly parachainId: number;

  readonly ss58Format: number;

  readonly usesChainDecimals: boolean;

  readonly weight: number | undefined;

  readonly ws: string;

  constructor({
    genesisHash,
    parachainId,
    usesChainDecimals,
    ss58Format,
    weight,
    ws,
    ...others
  }: ParachainParams) {
    super({ ...others });
    this.genesisHash = genesisHash;
    this.parachainId = parachainId;
    this.ss58Format = ss58Format;
    this.usesChainDecimals = !!usesChainDecimals;
    this.weight = weight;
    this.ws = ws;
  }

  getType(): ChainType {
    return ChainType.EvmParachain;
  }

  getAssetMin(asset: Asset): number {
    return this.assetsData.get(asset.key)?.min ?? 0;
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
