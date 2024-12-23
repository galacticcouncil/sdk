import { Asset } from '../asset';

export enum ChainType {
  'Parachain' = 'parachain',
  'EvmParachain' = 'evm-parachain',
  'EvmChain' = 'evm-chain',
  'SolanaChain' = 'solana-chain',
}

export enum ChainEcosystem {
  Ethereum = 'ethereum',
  Polkadot = 'polkadot',
  Kusama = 'kusama',
  Solana = 'solana',
}

export type ChainAssetId =
  | string
  | number
  | bigint
  | { [key: string]: ChainAssetId };

/**
 * Chain Asset Data
 *
 * @interface ChainAssetData
 * @member {Asset} asset asset key & symbol
 * @member {number} decimals asset decimals
 * @member {ChainAssetId} id asset internal id
 * @member {ChainAssetId} balanceId asset id to query balance (if other than internal)
 * @member {AssetAmount} min asset minimal deposit
 */
export interface ChainAssetData {
  asset: Asset;
  balanceId?: ChainAssetId;
  decimals?: number;
  id?: ChainAssetId;
  min?: number;
}

export interface ChainParams<T extends ChainAssetData> {
  assetsData: T[];
  ecosystem?: ChainEcosystem;
  isTestChain?: boolean;
  key: string;
  name: string;
}

export abstract class Chain<T extends ChainAssetData> {
  readonly assetsData: Map<string, T>;

  readonly ecosystem?: ChainEcosystem;

  readonly isTestChain: boolean;

  readonly key: string;

  readonly name: string;

  constructor({
    assetsData,
    ecosystem,
    isTestChain = false,
    key,
    name,
  }: ChainParams<T>) {
    this.assetsData = new Map(assetsData.map((data) => [data.asset.key, data]));
    this.ecosystem = ecosystem;
    this.isTestChain = isTestChain;
    this.key = key;
    this.name = name;
  }

  abstract getType(): ChainType;

  isSubstrate(): boolean {
    return (
      this.getType() === ChainType.Parachain ||
      this.getType() === ChainType.EvmParachain
    );
  }

  isEvm(): boolean {
    return (
      this.getType() === ChainType.EvmChain ||
      this.getType() === ChainType.EvmParachain
    );
  }

  isSolana(): boolean {
    return this.getType() === ChainType.SolanaChain;
  }

  isEvmChain(): boolean {
    return this.getType() === ChainType.EvmChain;
  }

  isEvmParachain(): boolean {
    return this.getType() === ChainType.EvmParachain;
  }

  isParachain(): boolean {
    return this.getType() === ChainType.Parachain;
  }

  getAsset(key: string): Asset | undefined {
    return this.assetsData.get(key)?.asset;
  }

  getAssetId(asset: Asset): ChainAssetId {
    return this.assetsData.get(asset.key)?.id ?? asset.originSymbol;
  }

  getAssetDecimals(asset: Asset): number | undefined {
    return this.assetsData.get(asset.key)?.decimals;
  }

  getAssetMin(asset: Asset): number {
    return this.assetsData.get(asset.key)?.min ?? 0;
  }

  getBalanceAssetId(asset: Asset): ChainAssetId {
    return this.assetsData.get(asset.key)?.balanceId ?? this.getAssetId(asset);
  }

  updateAsset(asset: T): void {
    this.assetsData.set(asset.asset.key, asset);
  }
}
