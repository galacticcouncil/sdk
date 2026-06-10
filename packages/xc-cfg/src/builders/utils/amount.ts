export function padFeeByPercentage(fee: bigint, padPercent: bigint) {
  if (padPercent < 0 || padPercent > 100) {
    throw Error(`padPercent ${padPercent} not in range of 0 to 100.`);
  }
  return fee + (fee * padPercent) / 100n;
}

export function scaledPadPercentage(
  staticPadPercent: bigint,
  tip: bigint,
  rawCost: bigint
): bigint {
  if (staticPadPercent <= 0n) return 0n;
  if (rawCost <= 0n) return staticPadPercent;
  if (tip <= 0n) return staticPadPercent;
  if (tip >= rawCost) return 0n;
  const remaining = rawCost - tip;
  return (remaining * remaining * staticPadPercent) / (rawCost * rawCost);
}
