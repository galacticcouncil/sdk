import { BigNumber, bnum, ONE } from './bignumber';

const PCT_100 = bnum('100');

/**
 * Percentage Difference Formula
 *
 * (|𝑉1−𝑉2| / [(𝑉1+𝑉2)/2]) × 100
 *
 * This formula calculates the percentage difference by comparing
 * the absolute difference between the two values with their <b>average</b>.
 *
 * Usage: It's used when you want to find the percentage difference between
 * two quantities where both quantities are significant.
 *
 * @param v1 - 1st value
 * @param v2 - 2nd value
 * @returns Difference between two values in relation to their average
 */
export function calculateDiffToAvg(v1: BigNumber, v2: BigNumber): BigNumber {
  const impact = v1.minus(v2).abs().div(v1.plus(v2).div(2)).multipliedBy(100);
  return impact.decimalPlaces(2);
}

/**
 * Percentage Difference Formula (Relative Change)
 *
 * ((Vfin-Vref) / Vref) * 100
 *
 * This formula calculates the percentage difference by comparing
 * the absolute difference between the two values with the <b>reference value</b>.
 *
 * Usage: This formula isn't suitable for finding percentage differences
 * when the values being compared are not reference and final values of the
 * same quantity.
 *
 * @param vFin - final value
 * @param vRef - reference value
 * @returns Difference between a final value and a reference value in relation to the reference value
 */
export function calculateDiffToRef(
  vFin: BigNumber,
  vRef: BigNumber
): BigNumber {
  const impact = vFin.minus(vRef).div(vRef).multipliedBy(100);
  return impact.decimalPlaces(2);
}

/**
 * The total fee paid for a ‘sell’ transaction
 * Suppose the trader is selling X for Y
 *
 * fee = 1 - (deltaY / delta0Y)
 *
 * @param delta0Y - the amount out if fees are zero
 * @param deltaY - the amount out if the existing nonzero fees are included in the calculation
 */
export function calculateSellFee(delta0Y: BigNumber, deltaY: BigNumber) {
  const total = ONE.minus(deltaY.div(delta0Y));
  return total.multipliedBy(100).decimalPlaces(2);
}

/**
 * The total fee paid for a ‘buy‘ transaction
 * Suppose the trader is buying Y using X
 *
 * fee = (deltaX / delta0X) - 1
 *
 * @param delta0X - the amount in if fees are zero
 * @param deltaX - the amount in, inclusive of fees
 */
export function calculateBuyFee(delta0X: BigNumber, deltaX: BigNumber) {
  const total = deltaX.div(delta0X).minus(ONE);
  return total.multipliedBy(100).decimalPlaces(2);
}

/**
 * Get % fraction from amount
 *
 * @param value - amount
 * @param pct - percentage value
 * @returns fraction of given amount
 */
export function getFraction(value: BigNumber, pct: number): BigNumber {
  if (pct < 0.01 || pct > 100) {
    new Error('Supported range is from 0.01% - 100%');
  }
  const fraction = value.div(PCT_100).multipliedBy(pct);
  return fraction.decimalPlaces(0, 1);
}
