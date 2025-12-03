import { PolkadotClient } from 'polkadot-api';

import { Asset } from '../asset';
import { SubstrateApis } from '../substrate';
import {
  Chain,
  ChainAssetData,
  ChainAssetId,
  ChainCurrency,
  ChainParams,
  ChainType,
} from './Chain';

/**
 * Type for XCM multi-location objects (JSON-serializable)
 */
type XcmLocation = Record<string, any>;

/**
 * XCM Version enum
 */
export enum XcmVersion {
  v1 = 'V1',
  v2 = 'V2',
  v3 = 'V3',
  v4 = 'V4',
  v5 = 'V5',
}

/**
 * Parachain Asset Data
 *
 * @interface ParachainAssetsData
 * @member {ChainAssetId} metadataId asset id to query metadata (if other than internal)
 * @member {ChainAssetId} minId asset id to query minimal deposit (if other than internal)
 * @member {XcmLocation} xcmLocation asset xcm location
 */
export interface ParachainAssetData extends ChainAssetData {
  metadataId?: ChainAssetId;
  minId?: ChainAssetId;
  xcmLocation?: XcmLocation;
}

export interface ParachainParams extends ChainParams<ParachainAssetData> {
  genesisHash: string;
  parachainId: number;
  ss58Format: number;
  treasury?: string;
  usesChainDecimals?: boolean;
  usesCexForwarding?: boolean;
  usesDeliveryFee?: boolean;
  usesSignerFee?: boolean;
  usesH160Acc?: boolean;
  ws: string | string[];
  xcmVersion?: XcmVersion;
}

export class Parachain extends Chain<ParachainAssetData> {
  readonly genesisHash: string;

  readonly parachainId: number;

  readonly ss58Format: number;

  readonly treasury: string | undefined;

  readonly usesChainDecimals: boolean;

  readonly usesCexForwarding: boolean;

  readonly usesDeliveryFee: boolean;

  readonly usesSignerFee: boolean;

  readonly usesH160Acc: boolean;

  readonly ws: string | string[];

  readonly xcmVersion: XcmVersion;

  constructor({
    genesisHash,
    parachainId,
    ss58Format,
    treasury,
    usesChainDecimals = false,
    usesCexForwarding = false,
    usesDeliveryFee = false,
    usesSignerFee = false,
    usesH160Acc = false,
    ws,
    xcmVersion = XcmVersion.v4,
    ...others
  }: ParachainParams) {
    super({ ...others });
    this.genesisHash = genesisHash;
    this.parachainId = parachainId;
    this.ss58Format = ss58Format;
    this.treasury = treasury;
    this.usesChainDecimals = usesChainDecimals;
    this.usesCexForwarding = usesCexForwarding;
    this.usesDeliveryFee = usesDeliveryFee;
    this.usesSignerFee = usesSignerFee;
    this.usesH160Acc = usesH160Acc;
    this.ws = ws;
    this.xcmVersion = xcmVersion;
  }

  get api(): PolkadotClient {
    const pool = SubstrateApis.getInstance();
    return pool.api(this.ws);
  }

  getType(): ChainType {
    return ChainType.Parachain;
  }

  async getCurrency(): Promise<ChainCurrency> {
    const client = this.api;
    const chainSpec = await client.getChainSpecData();

    const { tokenSymbol, tokenDecimals } = chainSpec.properties || {};

    const symbol = Array.isArray(tokenSymbol) ? tokenSymbol[0] : tokenSymbol;
    const decimals = Array.isArray(tokenDecimals)
      ? tokenDecimals[0]
      : tokenDecimals;

    const asset = this.getAsset(symbol.toLowerCase());
    if (asset) {
      return { asset, decimals } as ChainCurrency;
    }
    throw Error('Chain currency configuration not found');
  }

  getAssetXcmLocation(asset: Asset): XcmLocation | undefined {
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
