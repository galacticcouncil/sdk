import { bnum, ONE } from './bignumber';

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
export function calculateDiffToAvg(v1: bigint, v2: bigint): number {
  const v1b = bnum(v1);
  const v2b = bnum(v2);

  return v1b
    .minus(v2b)
    .abs()
    .div(v1b.plus(v2b).div(2))
    .multipliedBy(100)
    .decimalPlaces(2)
    .toNumber();
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
export function calculateDiffToRef(vFin: bigint, vRef: bigint): number {
  const vFinb = bnum(vFin);
  const vRefb = bnum(vRef);

  return vFinb
    .minus(vRefb)
    .div(vRefb)
    .multipliedBy(100)
    .decimalPlaces(2)
    .toNumber();
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
export function calculateSellFee(delta0Y: bigint, deltaY: bigint): number {
  const delta0Yb = bnum(delta0Y);
  const deltaYb = bnum(deltaY);

  return ONE.minus(deltaYb.div(delta0Yb))
    .multipliedBy(100)
    .decimalPlaces(2)
    .toNumber();
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
export function calculateBuyFee(delta0X: bigint, deltaX: bigint): number {
  const delta0Xb = bnum(delta0X);
  const deltaXb = bnum(deltaX);

  return deltaXb
    .div(delta0Xb)
    .minus(ONE)
    .multipliedBy(100)
    .decimalPlaces(2)
    .toNumber();
}

/**
 * Get % fraction from value
 *
 * @param value - native amount (bigint)
 * @param fraction - percentage value e.g. (0.1% => 0.1)
 * @param dp - safe decimals margin (0.001%)
 * @returns fraction of given amount
 */
export function multiplyByFraction(
  value: bigint,
  fraction: number,
  dp = 3
): bigint {
  const denominator = Math.pow(10, dp);
  const percentage = BigInt(fraction * denominator);
  return (value * percentage) / BigInt(100 * denominator);
}
