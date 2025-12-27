import Big from 'big.js';

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
  const v1b = Big(v1.toString());
  const v2b = Big(v2.toString());

  return v1b
    .minus(v2b)
    .abs()
    .div(v1b.plus(v2b).div(2))
    .mul(100)
    .round(2)
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
  if (vRef === 0n) return 0;

  const vFinb = Big(vFin.toString());
  const vRefb = Big(vRef.toString());

  return vFinb.minus(vRefb).div(vRefb).mul(100).round(2).toNumber();
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
  if (delta0Y === 0n) return 0;

  const delta0Yb = Big(delta0Y.toString());
  const deltaYb = Big(deltaY.toString());

  return Big(1).minus(deltaYb.div(delta0Yb)).mul(100).round(2).toNumber();
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
  if (delta0X === 0n) return 0;

  const delta0Xb = Big(delta0X.toString());
  const deltaXb = Big(deltaX.toString());

  return deltaXb.div(delta0Xb).minus(1).mul(100).round(2).toNumber();
}

/**
 * Get % fraction from native value
 *
 * @param value - native amount
 * @param pct - percentage value
 * @param dp - safe decimals margin (2dp = 0.01%)
 * @returns fraction of given amount
 */
export function getFraction(value: bigint, pct: number, dp = 2): bigint {
  if (pct < 0.01 || pct > 100) {
    new Error('Supported range is from 0.01% - 100%');
  }
  const denominator = Math.pow(10, dp);
  const percentage = BigInt(pct * denominator);
  return (value * percentage) / BigInt(100 * denominator);
}
