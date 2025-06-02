export type AaveCtx = {
  healthFactor: number;
  totalCollateral: bigint;
  totalDebt: bigint;
  reserves: AaveReserveCtx[];
};

export type AaveReserveCtx = {
  aTokenBalance: bigint;
  decimals: number;
  isCollateral: boolean;
  priceInRef: bigint;
  reserveId: number | null;
  reserveAsset: string;
  reserveLiquidationThreshold: number;
};
