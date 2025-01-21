export interface Humanizer {
  toHuman(): any;
}

export interface Transaction {
  hex: string;
  name?: string;
  get<T>(): T;
}

export type Amount = {
  amount: bigint;
  decimals: number;
};

export interface AssetAmount {
  id: number;
  amount: bigint;
}

export interface AssetMetadata {
  decimals: number;
  symbol: string;
}

export type AssetType = 'StableSwap' | 'Bond' | 'Token' | 'External' | 'Erc20';

export interface Asset extends AssetMetadata {
  id: number;
  name: string;
  icon: string;
  type: AssetType;
  existentialDeposit: bigint;
  isSufficient: boolean;
  location?: any;
  meta?: Record<string, string>;
  isWhiteListed?: boolean;
}

export interface Bond extends Asset {
  underlyingAssetId: string;
  maturity: number;
}

export interface ExternalAsset extends AssetMetadata {
  id: string;
  origin: number;
  name: string;
  internalId: number;
  isWhiteListed?: boolean;
}
