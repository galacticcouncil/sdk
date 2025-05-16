import BigNumber from 'bignumber.js';

export type AaveCtx = {
  healthFactor: number;
  totalCollateral: BigNumber;
  totalDebt: BigNumber;
  reserves: AaveReserveCtx[];
};

export type AaveReserveCtx = {
  aTokenBalance: BigNumber;
  decimals: number;
  isCollateral: boolean;
  priceInRef: BigNumber;
  reserveId: number | null;
  reserveAsset: string;
  reserveLiquidationThreshold: BigNumber;
};
