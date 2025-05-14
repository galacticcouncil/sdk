import BigNumber from 'bignumber.js';

export type AaveCtx = {
  decimals: number;
  isCollateralAsset: boolean;
  priceInRef: BigNumber;
  reserveLiquidationThreshold: BigNumber;
  totalCollateralBase: BigNumber;
  totalDebtBase: BigNumber;
  userBalance: BigNumber;
};
