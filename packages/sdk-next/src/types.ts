import { XcmV3Junctions } from '@polkadot-api/descriptors';

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
  location?: XcmV3Multilocation;
  meta?: Record<string, string>;
  isWhiteListed?: boolean;
}

export interface Bond extends Asset {
  underlyingAssetId: number;
  maturity: number;
}

export interface ExternalAsset extends AssetMetadata {
  id: string;
  origin: number;
  name: string;
  internalId: number;
  isWhiteListed?: boolean;
}

export type XcmV3Multilocation = {
  parents: number;
  interior: XcmV3Junctions;
};
