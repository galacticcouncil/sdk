import { Asset } from '@moonbeam-network/xcm-types';

export enum ChainType {
  'Parachain' = 'parachain',
  'EvmParachain' = 'evm-parachain',
  'EvmChain' = 'evm-chain',
}

export enum ChainEcosystem {
  Polkadot = 'polkadot',
  Kusama = 'kusama',
}

export type ChainAssetId =
  | string
  | number
  | bigint
  | { [key: string]: ChainAssetId };

export interface ChainAssetData {
  asset: Asset;
  decimals?: number;
  id?: ChainAssetId;
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

  getAssetId(asset: Asset): ChainAssetId {
    return this.assetsData.get(asset.key)?.id ?? asset.originSymbol;
  }

  getAssetDecimals(asset: Asset): number | undefined {
    return this.assetsData.get(asset.key)?.decimals;
  }
}
