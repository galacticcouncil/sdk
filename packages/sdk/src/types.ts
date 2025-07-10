import type { BigNumber } from './utils/bignumber';

export type Amount = {
  amount: BigNumber;
  decimals: number;
};

export interface Asset extends AssetMetadata {
  id: string;
  name: string;
  icon: string;
  type: string;
  existentialDeposit: string;
  isSufficient: boolean;
  location?: any;
  meta?: Record<string, string>;
  isWhiteListed?: boolean;
}

export interface AssetMetadata {
  decimals: number;
  symbol: string;
}

export interface Bond extends Asset {
  underlyingAssetId: string;
  maturity: number;
}

export interface ExternalAsset extends AssetMetadata {
  id: string;
  origin: number;
  name: string;
  internalId: string;
  isWhiteListed?: boolean;
}

export interface Balance {
  freeBalance: string;
  total: string;
  transferable: string;
  reservedBalance: string;
  frozenBalance: string;
}
