import { UserReserveData, ReserveData } from './types';

import { bnum, ZERO, BigNumber } from '../utils/bignumber';

const RAY = bnum('1e27');
const ORACLE_DECIMALS = bnum('1e8');
const SECONDS_PER_YEAR = bnum('31536000');
const MAX_HF = bnum('999999999'); // close to 1 billion

export function formatUserReserveSummary(
  userReserve: UserReserveData,
  reserve: ReserveData,
  currentTimestamp: number
) {
  const decimals = Number(reserve.decimals);
  const unit = bnum(10).pow(decimals);

  const priceInRef = bnum(reserve.priceInMarketReferenceCurrency);
  const priceInUsd = priceInRef.div(ORACLE_DECIMALS);

  // User reserve values
  const scaledATokenBalance = bnum(userReserve.scaledATokenBalance);
  const scaledVariableDebt = bnum(userReserve.scaledVariableDebt);
  const principalStableDebt = bnum(userReserve.principalStableDebt);
  const stableBorrowRate = bnum(userReserve.stableBorrowRate);
  const stableBorrowLastUpdateTimestamp = Number(
    userReserve.stableBorrowLastUpdateTimestamp
  );

  // Indices
  const liquidityIndex = bnum(reserve.liquidityIndex);
  const variableBorrowIndex = bnum(reserve.variableBorrowIndex);

  // Time delta for interest accrual
  const secondsSinceLastUpdate = bnum(
    currentTimestamp - stableBorrowLastUpdateTimestamp
  );

  const stableBorrows = principalStableDebt.isZero()
    ? ZERO
    : principalStableDebt
        .multipliedBy(
          stableBorrowRate
            .multipliedBy(secondsSinceLastUpdate)
            .dividedBy(SECONDS_PER_YEAR)
            .plus(RAY)
        )
        .dividedBy(RAY);

  const variableBorrows = scaledVariableDebt
    .multipliedBy(variableBorrowIndex)
    .dividedBy(RAY);

  const totalBorrows = stableBorrows.plus(variableBorrows);

  const underlyingBalance = scaledATokenBalance
    .multipliedBy(liquidityIndex)
    .dividedBy(RAY);

  // Human-readable token units
  const normUnderlying = underlyingBalance.dividedBy(unit);
  const normVariableBorrows = variableBorrows.dividedBy(unit);
  const normStableBorrows = stableBorrows.dividedBy(unit);
  const normTotalBorrows = totalBorrows.dividedBy(unit);

  // Convert to market reference currency and USD
  const toRef = (val: BigNumber) =>
    val.multipliedBy(priceInRef).dividedBy(ORACLE_DECIMALS);
  const toUsd = (val: BigNumber) => val.multipliedBy(priceInUsd);

  return {
    principalStableDebt: principalStableDebt.toFixed(),
    scaledATokenBalance: scaledATokenBalance.toFixed(),
    scaledVariableDebt: scaledVariableDebt.toFixed(),
    usageAsCollateralEnabledOnUser: userReserve.usageAsCollateralEnabledOnUser,

    // Underlying balances
    underlyingAsset: userReserve.underlyingAsset,
    underlyingBalance: normUnderlying.toFixed(),
    underlyingBalanceMarketReferenceCurrency: toRef(normUnderlying).toFixed(),
    underlyingBalanceUSD: toUsd(normUnderlying).toFixed(),

    // Variable borrows
    variableBorrows: normVariableBorrows.toFixed(),
    variableBorrowsMarketReferenceCurrency:
      toRef(normVariableBorrows).toFixed(),
    variableBorrowsUSD: toUsd(normVariableBorrows).toFixed(),

    // Stable borrows
    stableBorrowRate: stableBorrowRate.toFixed(),
    stableBorrowLastUpdateTimestamp: stableBorrowLastUpdateTimestamp.toString(),
    stableBorrows: normStableBorrows.toFixed(),
    stableBorrowsMarketReferenceCurrency: toRef(normStableBorrows).toFixed(),
    stableBorrowsUSD: toUsd(normStableBorrows).toFixed(),

    // Total borrows
    totalBorrows: normTotalBorrows.toFixed(),
    totalBorrowsMarketReferenceCurrency: toRef(normTotalBorrows).toFixed(),
    totalBorrowsUSD: toUsd(normTotalBorrows).toFixed(),
  };
}

export function formatUserSummary(
  userReserves: UserReserveData[],
  reserves: ReserveData[],
  currentTimestamp: number,
  userEmodeCategoryId: number
) {
  let totalCollateralUSD = ZERO;
  let totalCollateralRef = ZERO;
  let totalLiquidityUSD = ZERO;
  let totalLiquidityRef = ZERO;
  let totalBorrowsUSD = ZERO;
  let totalBorrowsRef = ZERO;
  let sumLTV = ZERO;
  let sumLiquidationThreshold = ZERO;

  for (const userReserve of userReserves) {
    const reserve = reserves.find(
      (r) =>
        r.underlyingAsset.toLowerCase() ===
        userReserve.underlyingAsset.toLowerCase()
    );
    if (!reserve) continue;

    const formatted = formatUserReserveSummary(
      userReserve,
      reserve,
      currentTimestamp
    );

    const ltv = bnum(reserve.baseLTVasCollateral).div(10000);
    const threshold = bnum(reserve.reserveLiquidationThreshold).div(10000);

    const isEmode =
      userEmodeCategoryId !== 0 &&
      reserve.eModeCategoryId === userEmodeCategoryId;

    const emodeLTV = isEmode ? bnum(reserve.eModeLtv).div(10000) : ltv;
    const emodeThreshold = isEmode
      ? bnum(reserve.eModeLiquidationThreshold).div(10000)
      : threshold;

    const balance = bnum(formatted.underlyingBalance);
    const borrows = bnum(formatted.totalBorrows);

    const balanceUSD = bnum(formatted.underlyingBalanceUSD);
    const balanceRef = bnum(formatted.underlyingBalanceMarketReferenceCurrency);
    const borrowUSD = bnum(formatted.totalBorrowsUSD);
    const borrowRef = bnum(formatted.totalBorrowsMarketReferenceCurrency);

    const collateralEnabled =
      userReserve.usageAsCollateralEnabledOnUser && balance.gt(0);

    totalLiquidityUSD = totalLiquidityUSD.plus(balanceUSD);
    totalLiquidityRef = totalLiquidityRef.plus(balanceRef);
    totalBorrowsUSD = totalBorrowsUSD.plus(borrowUSD);
    totalBorrowsRef = totalBorrowsRef.plus(borrowRef);

    if (collateralEnabled) {
      totalCollateralUSD = totalCollateralUSD.plus(balanceUSD);
      totalCollateralRef = totalCollateralRef.plus(balanceRef);

      sumLTV = sumLTV.plus(balanceUSD.times(emodeLTV));
      sumLiquidationThreshold = sumLiquidationThreshold.plus(
        balanceUSD.times(emodeThreshold)
      );
    }
  }

  const netWorthUSD = totalCollateralUSD.minus(totalBorrowsUSD);
  const currentLoanToValue = totalCollateralUSD.gt(0)
    ? sumLTV.div(totalCollateralUSD)
    : ZERO;

  const currentLiquidationThreshold = totalCollateralUSD.gt(0)
    ? sumLiquidationThreshold.div(totalCollateralUSD)
    : ZERO;

  const availableBorrowsUSD = sumLTV.minus(totalBorrowsUSD).gt(0)
    ? sumLTV.minus(totalBorrowsUSD)
    : ZERO;

  // Market reference currency = USD, so no need to infer baseAsset
  const availableBorrowsRef = availableBorrowsUSD;

  const healthFactor = totalBorrowsUSD.gt(0)
    ? sumLiquidationThreshold.div(totalBorrowsUSD)
    : MAX_HF;

  return {
    availableBorrowsMarketReferenceCurrency: availableBorrowsRef.toFixed(),
    availableBorrowsUSD: availableBorrowsUSD.toFixed(),
    currentLiquidationThreshold: currentLiquidationThreshold.toFixed(),
    currentLoanToValue: currentLoanToValue.toFixed(),
    healthFactor: healthFactor.toFixed(),
    isInIsolationMode: false,
    netWorthUSD: netWorthUSD.toFixed(),
    totalBorrowsMarketReferenceCurrency: totalBorrowsRef.toFixed(),
    totalBorrowsUSD: totalBorrowsUSD.toFixed(),
    totalCollateralMarketReferenceCurrency: totalCollateralRef.toFixed(),
    totalCollateralUSD: totalCollateralUSD.toFixed(),
    totalLiquidityMarketReferenceCurrency: totalLiquidityRef.toFixed(),
    totalLiquidityUSD: totalLiquidityUSD.toFixed(),
    userEmodeCategoryId,
  };
}
