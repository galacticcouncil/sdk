import { PolkadotClient } from 'polkadot-api';

import { big, SubstrateApis } from '@galacticcouncil/common';

import { Observable } from 'rxjs';

import { Asset, AssetAmount } from '../asset';
import {
  BalanceType,
  SubstrateBalanceClient,
  SubstrateBalanceType,
  SubstrateMinType,
} from './balance';
import {
  Chain,
  ChainAssetData,
  ChainAssetId,
  ChainCurrency,
  ChainParams,
  ChainType,
} from './Chain';

/**
 * XCM multi-location objects (JSON-serializable)
 */
export type XcmLocation = Record<string, any>;

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
 * Parachain spec
 */
export interface ParachainSpec {
  name: string;
  genesisHash: string;
  properties: any;
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

export interface ParachainParams<
  B extends BalanceType = SubstrateBalanceType,
> extends ChainParams<ParachainAssetData, B> {
  genesisHash: string;
  /**
   * Dynamic minimum storage type (e.g. AssetHub `assets.asset`). Optional —
   * chains with static minimums rely on `assetsData[*].min` instead.
   */
  min?: SubstrateMinType;
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

export class Parachain<
  B extends BalanceType = SubstrateBalanceType,
> extends Chain<ParachainAssetData, B> {
  private _chainSpec?: Promise<ParachainSpec>;

  protected readonly balanceClient = new SubstrateBalanceClient(this);

  readonly min?: SubstrateMinType;

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
    min,
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
  }: ParachainParams<B>) {
    super({ ...others } as ChainParams<ParachainAssetData, B>);
    this.min = min;
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

  get client(): PolkadotClient {
    const pool = SubstrateApis.getInstance();
    return pool.api(this.ws);
  }

  getType(): ChainType {
    return ChainType.Parachain;
  }

  async getSpec(): Promise<ParachainSpec> {
    if (!this._chainSpec) {
      this._chainSpec = this.client.getChainSpecData();
    }
    return this._chainSpec;
  }

  async getCurrency(): Promise<ChainCurrency> {
    const chainSpec = await this.getSpec();

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

  getMinType(): SubstrateMinType | undefined {
    return this.min;
  }

  async getBalance(asset: Asset, address: string): Promise<AssetAmount> {
    return this.balanceClient.getBalance(
      asset,
      address,
      this.getBalanceType(asset) as SubstrateBalanceType
    );
  }

  subscribeBalance(asset: Asset, address: string): Observable<AssetAmount> {
    return this.balanceClient.subscribe(
      asset,
      address,
      this.getBalanceType(asset) as SubstrateBalanceType
    );
  }

  async getMin(asset: Asset): Promise<AssetAmount> {
    const type = this.getMinType();
    if (type) {
      return this.balanceClient.getMin(asset, type);
    }

    const min = this.getAssetMin(asset);
    const decimals = await this.resolveDecimals(asset);
    return AssetAmount.fromAsset(asset, {
      amount: min ? big.toBigInt(min, decimals) : 0n,
      decimals,
    });
  }

  async getEd(): Promise<AssetAmount> {
    return this.balanceClient.getEd();
  }

  findAssetById(id: string) {
    return Array.from(this.assetsData.values()).find((a) => {
      return Object.hasOwn(a, 'metadataId')
        ? a.metadataId?.toString() === id
        : a.id?.toString() === id;
    });
  }
}
