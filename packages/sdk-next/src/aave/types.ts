export type AaveSummary = {
  healthFactor: number;
  totalCollateral: bigint;
  totalDebt: bigint;
  reserves: AaveReserveData[];
};

export type AaveReserveData = {
  aTokenBalance: bigint;
  decimals: number;
  isCollateral: boolean;
  priceInRef: bigint;
  reserveId: number | null;
  reserveAsset: string;
  reserveLiquidationThreshold: number;
};
