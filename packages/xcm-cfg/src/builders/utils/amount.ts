export function padFeeByPercentage(fee: bigint, padPercent: bigint) {
  if (padPercent < 0 || padPercent > 100) {
    throw Error(`padPercent ${padPercent} not in range of 0 to 100.`);
  }
  return fee + (fee * padPercent) / 100n;
}
