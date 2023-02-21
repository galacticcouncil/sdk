export interface Chain {
  chainkey: string;
  name: string;
  id: string;
  paraID: number;
  WSEndpoints: string[];
  relaychain: string;
}

export interface ChainAssetType {
  Erc20: string;
  ForeignAsset: string;
  LiquidCrowdloan: string;
  StableAsset: string;
  Token: string;
}

export interface ChainAsset {
  asset: ChainAssetType;
  name: string;
  symbol: string;
  decimals: number;
  xcmInteriorKey: string;
}
