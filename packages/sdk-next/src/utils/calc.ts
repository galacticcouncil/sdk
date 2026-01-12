import { RUNTIME_DECIMALS } from '@galacticcouncil/common';

/**
 * Multiply two fixed-point bigint values and rescale the result
 * to the desired target decimals.
 *
 * This helper is fully generic and supports both scaling down
 * (division) and scaling up (adding trailing zeroes).
 *
 * @param value - base value (native bigint)
 * @param multiplier - multiplier value (native bigint)
 * @param valueDecimals - decimals of the base value
 * @param multiplierDecimals - decimals of the multiplier
 * @param targetDecimals - desired decimals of the result
 * @returns scaled multiplication result
 */
export function mulScaled(
  value: bigint,
  multiplier: bigint,
  valueDecimals: number,
  multiplierDecimals: number,
  targetDecimals: number
): bigint {
  const exp = valueDecimals + multiplierDecimals - targetDecimals;

  const amount = value * multiplier;

  if (exp > 0) {
    return amount / BigInt(10) ** BigInt(exp);
  }

  if (exp < 0) {
    return amount * BigInt(10) ** BigInt(-exp);
  }

  return amount;
}

/**
 * Multiply a value by a spot price and rescale the result
 * to the desired target decimals.
 *
 * Spot price is assumed to be scaled by `RUNTIME_DECIMALS`
 * (currently 18).
 *
 * @param value - base value (native bigint)
 * @param spot - spot price (scaled by RUNTIME_DECIMALS)
 * @param valueDecimals - decimals of the base value
 * @param targetDecimals - desired decimals of the result
 * @returns scaled spot multiplication result
 */
export function mulSpot(
  value: bigint,
  spot: bigint,
  valueDecimals: number,
  targetDecimals: number
): bigint {
  return mulScaled(
    value,
    spot,
    valueDecimals,
    RUNTIME_DECIMALS,
    targetDecimals
  );
}

/**
 * Get % fraction from native value
 *
 * @param value - native amount
 * @param pct - percentage value (e.g. 0.5 = 0.5%)
 * @param dp - safe decimals margin (2dp = 0.01%)
 * @returns fraction of given amount
 */
export function getFraction(value: bigint, pct: number, dp = 2): bigint {
  if (pct < 0.01 || pct > 100) {
    throw new Error('Supported range is from 0.01% - 100%');
  }

  const denom = BigInt(10) ** BigInt(dp);
  const pctScaled = BigInt(Math.round(pct * Number(denom)));

  return (value * pctScaled) / (BigInt(100) * denom);
}
