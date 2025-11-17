import BigNumber from 'bignumber.js';

export type AaveSummary = {
  healthFactor: number;
  currentLiquidationThreshold: number;
  totalCollateral: BigNumber;
  totalDebt: BigNumber;
  reserves: AaveReserveData[];
};

export type AaveReserveData = {
  aTokenBalance: BigNumber;
  availableLiquidity: BigNumber;
  decimals: number;
  isCollateral: boolean;
  priceInRef: BigNumber;
  reserveId: number | null;
  reserveAsset: string;
  reserveLiquidationThreshold: BigNumber;
};
