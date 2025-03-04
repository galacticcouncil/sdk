import Big, { RoundingMode } from 'big.js';

Big.NE = -18;

export function toDecimal(
  amount: bigint,
  decimals: number,
  maxDecimal = 6,
  roundType?: RoundingMode
): string {
  const dividend = Big(amount.toString());
  const divisor = Big(10).pow(decimals);
  const result = dividend.div(divisor).round(maxDecimal, roundType);
  return result.toString();
}

export function toBigInt(amount: string | number, decimals: number): bigint {
  const multiplier = Big(10).pow(decimals);
  const result = Big(amount).mul(multiplier);
  const fixedPoint = result.toFixed(0, Big.roundDown);
  return BigInt(fixedPoint);
}
