/**
 * Floors an amount to a coarser precision.
 *
 * - Untouched when its own precision is already at most `precision`
 *
 * @param amount - amount in `decimals`
 * @param decimals - decimals of the amount
 * @param precision - decimals to keep
 */
export function floorToPrecision(
  amount: bigint,
  decimals: number,
  precision: number
): bigint {
  if (decimals <= precision) {
    return amount;
  }
  const dust = 10n ** BigInt(decimals - precision);
  return amount - (amount % dust);
}

export function padFeeByPercentage(fee: bigint, padPercent: bigint) {
  if (padPercent < 0 || padPercent > 100) {
    throw Error(`padPercent ${padPercent} not in range of 0 to 100.`);
  }
  return fee + (fee * padPercent) / 100n;
}
