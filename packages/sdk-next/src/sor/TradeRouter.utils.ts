import { RUNTIME_DECIMALS } from '@galacticcouncil/common';

export function calculateSwapAmount(
  amountIn: bigint,
  spot: bigint,
  decimalsIn: number,
  decimalsOut: number
): bigint {
  const factor = Math.pow(10, decimalsIn + RUNTIME_DECIMALS - decimalsOut);
  return (amountIn * spot) / BigInt(factor);
}
