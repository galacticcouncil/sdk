import Big from 'big.js';

import { big } from '@galacticcouncil/common';

import { AaveMarketReserve, AaveMarketSummary } from './types';

import { Amount } from '../types';

/** Health factor reported when the user has no debt */
export const INVALID_HF = -1;

/** Health factor a max withdraw leaves behind */
export const TARGET_WITHDRAW_HF = 1.01;

/**
 * The health factor Aave reports, as a number.
 *
 * - `INVALID_HF` without debt, where Aave reports the max uint256
 *
 * @param totalDebt - the user's debt in the reference currency
 * @param healthFactor - on-chain health factor (wad)
 */
export function toHealthFactor(
  totalDebt: bigint,
  healthFactor: bigint
): number {
  return totalDebt === 0n
    ? INVALID_HF
    : Number(big.toDecimal(healthFactor, 18));
}

const RAY = 10n ** 27n;
const SECONDS_PER_YEAR = 31536000n;

/** Every borrowing bit of an Aave user configuration (bits 2i) */
const BORROWING_MASK = BigInt(
  '0x5555555555555555555555555555555555555555555555555555555555555555'
);

/** A signed change of one reserve's aToken balance, in native units */
export type AaveBalanceDelta = {
  reserve: AaveMarketReserve;
  amount: bigint;
};

/**
 * Whether the user borrows any reserve of the market.
 *
 * @param config - user configuration bitmap
 */
export function isBorrowingAny(config: bigint): boolean {
  return (config & BORROWING_MASK) !== 0n;
}

/**
 * Whether the user uses a reserve as collateral.
 *
 * @param config - user configuration bitmap
 * @param index - reserve index in its pool
 */
export function isUsingAsCollateral(config: bigint, index: number): boolean {
  return ((config >> BigInt(index * 2 + 1)) & 1n) === 1n;
}

/**
 * Projected aToken balance at a timestamp.
 *
 * - Supply interest accrues linearly between index updates
 *
 * @param scaled - scaled aToken balance
 * @param liquidityIndex - reserve's last liquidity index (ray)
 * @param liquidityRate - reserve's current liquidity rate (ray)
 * @param lastUpdate - timestamp of the last index update
 * @param at - timestamp to project to
 */
export function accrueBalance(
  scaled: bigint,
  liquidityIndex: bigint,
  liquidityRate: bigint,
  lastUpdate: number,
  at: number
): bigint {
  const delta = at - lastUpdate;
  const interest =
    delta > 0 ? RAY + (liquidityRate * BigInt(delta)) / SECONDS_PER_YEAR : RAY;
  const index = (liquidityIndex * interest) / RAY;
  return (scaled * index) / RAY;
}

/**
 * Value of a native amount in the market's reference currency.
 *
 * @param amount - native amount
 * @param price - price in reference currency
 * @param decimals - asset decimals
 */
export function toRef(amount: bigint, price: bigint, decimals: number): bigint {
  return (amount * price) / 10n ** BigInt(decimals);
}

/**
 * Health factor after changing aToken balances within one market.
 *
 * - Anchored on the current health factor
 * - A zero change returns it unchanged
 * - A decrease counts only when the reserve is collateral now
 * - An increase counts only when the reserve would be collateral once received
 * - `INVALID_HF` when the user has no debt, `0` once collateral is gone
 *
 * @param summary - the user's position in the market
 * @param deltas - signed balance changes, native units
 */
export function projectHealthFactor(
  summary: AaveMarketSummary,
  deltas: AaveBalanceDelta[]
): number {
  const { healthFactor, totalDebt } = summary;
  if (totalDebt === 0n) return INVALID_HF;

  const weightedDelta = deltas.reduce((acc, { reserve, amount }) => {
    const counts =
      amount < 0n ? reserve.isCollateral : reserve.isCollateralOnSupply;
    if (!counts || amount === 0n) return acc;
    const valueRef = toRef(amount, reserve.priceInRef, reserve.decimals);
    return acc.plus(Big(valueRef.toString()).mul(reserve.liquidationThreshold));
  }, Big(0));

  const projected = Big(healthFactor).plus(
    weightedDelta.div(totalDebt.toString())
  );
  return projected.lte(0) ? 0 : Number(projected.toFixed(6, Big.roundDown));
}

/**
 * Largest aToken amount a user can withdraw from a reserve.
 *
 * - Collateral with debt is capped so the health factor stays at
 *   `TARGET_WITHDRAW_HF`: `(HF - 1.01) x totalDebt / reserveLT`
 * - Always capped by the reserve's available liquidity
 * - Capped by the free balance when the aToken locks part of it
 *
 * @param summary - the user's position in the market
 * @param reserve - the reserve to withdraw from
 * @param freeBalance - unlocked balance, when the aToken is lockable
 */
export function maxWithdraw(
  summary: AaveMarketSummary,
  reserve: AaveMarketReserve,
  freeBalance?: bigint
): Amount {
  const { healthFactor, totalDebt } = summary;
  const {
    aTokenBalance,
    availableLiquidity,
    decimals,
    priceInRef,
    liquidationThreshold,
    isCollateral,
  } = reserve;

  let max = aTokenBalance;

  if (isCollateral && totalDebt > 0n) {
    const excessHF = Big(healthFactor).minus(TARGET_WITHDRAW_HF);
    if (excessHF.gt(0)) {
      const maxRef = excessHF
        .mul(totalDebt.toString())
        .div(liquidationThreshold)
        .toFixed(0, Big.roundDown);

      const hfCapped = BigInt(
        Big(maxRef)
          .div(priceInRef.toString())
          .mul(10 ** decimals)
          .toFixed(0, Big.roundDown)
      );
      max = aTokenBalance < hfCapped ? aTokenBalance : hfCapped;
    } else {
      max = 0n;
    }
  }

  if (availableLiquidity < max) max = availableLiquidity;
  if (freeBalance !== undefined && freeBalance < max) max = freeBalance;

  return { amount: max, decimals } as Amount;
}
