import { PolkadotClient } from 'polkadot-api';
import { metadata as metadataCodec } from '@polkadot-api/substrate-bindings';

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

  /**
   * Get XCM version for a specific pallet call by inspecting runtime metadata via PAPI
   * This dynamically detects which XCM versions are supported by the pallet
   *
   * @param pallet - Pallet name (e.g., 'xTokens', 'polkadotXcm')
   * @param method - Method name (e.g., 'transfer', 'transferMultiasset')
   * @param argIndex - Index of the argument to inspect (usually the dest/beneficiary param)
   * @returns Promise<XcmVersion> - Detected XCM version
   */
  async getXcmVersionForCall(
    pallet: string,
    method: string,
    argIndex: number = 0
  ): Promise<XcmVersion> {
    try {
      const client = this.api;
      const finalizedBlock = await client.getFinalizedBlock();
      const metadataRaw = await client.getMetadata(finalizedBlock.hash);

      // Decode metadata from raw bytes
      const decodedMetadata = metadataCodec.dec(metadataRaw);

      // Extract the actual metadata (handle v14/v15)
      const metadataValue =
        decodedMetadata.metadata.tag === 'v14' ||
        decodedMetadata.metadata.tag === 'v15'
          ? decodedMetadata.metadata.value
          : null;

      if (!metadataValue) {
        throw new Error('Unsupported metadata version');
      }

      const metadata = metadataValue as any;

      // Find the pallet in metadata
      const palletMeta = metadata.pallets.find(
        (p: any) => p.name.toLowerCase() === pallet.toLowerCase()
      );

      if (!palletMeta?.calls) {
        throw new Error(`Pallet ${pallet} not found or has no calls`);
      }

      // Get the call index
      const callsLookup = metadata.lookup[palletMeta.calls];
      if (!callsLookup || callsLookup.type !== 'enum') {
        throw new Error(`Invalid calls structure for pallet ${pallet}`);
      }

      // Find the specific method
      const methodKey = Object.keys(callsLookup.value).find(
        (key) => key.toLowerCase() === method.toLowerCase()
      );

      if (!methodKey) {
        throw new Error(`Method ${method} not found in pallet ${pallet}`);
      }

      const methodDef = callsLookup.value[methodKey];

      if (!methodDef.value || !methodDef.value.length) {
        // No arguments, default to chain's xcmVersion
        return this.xcmVersion;
      }

      // Get the argument type ID
      const argTypeId = methodDef.value[argIndex];
      if (argTypeId === undefined) {
        throw new Error(
          `Argument index ${argIndex} not found for ${pallet}.${method}`
        );
      }

      // Lookup the type definition
      const argType = metadata.lookup[argTypeId];

      // Check if it's an enum with version variants (V1, V2, V3, V4, V5)
      if (argType && argType.type === 'enum') {
        const variants = Object.keys(argType.value);

        // Check for XCM version variants in descending order
        if (variants.includes('V5')) return XcmVersion.v5;
        if (variants.includes('V4')) return XcmVersion.v4;
        if (variants.includes('V3')) return XcmVersion.v3;
        if (variants.includes('V2')) return XcmVersion.v2;
        if (variants.includes('V1')) return XcmVersion.v1;
      }

      // If we can't detect from metadata, use the chain's default
      return this.xcmVersion;
    } catch (error) {
      console.warn(
        `Failed to detect XCM version for ${pallet}.${method}:`,
        error
      );
      // Fallback to chain's default version
      return this.xcmVersion;
    }
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
    const properties = chainSpec.properties || {};

    const symbols: string[] = properties.tokenSymbol || [];
    const decimalsArray: number[] = properties.tokenDecimals || [];

    const symbol = symbols[0];
    const decimals = decimalsArray[0];

    if (symbol) {
      const asset = this.getAsset(symbol.toLowerCase());
      if (asset) {
        return { asset, decimals } as ChainCurrency;
      }
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
