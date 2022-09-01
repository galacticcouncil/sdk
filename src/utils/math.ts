import { BigNumber, bnum, scale, DECIMAL_PLACES } from './bignumber';

export function tradeFee(percentage: string): BigNumber {
  return bnum(parseFloat(percentage) / 100);
}

export function calculateTradeFee(
  amount: BigNumber,
  tradeFee: BigNumber
): BigNumber {
  return amount.multipliedBy(tradeFee).decimalPlaces(0, 1);
}

export function normalizeAmount(
  amount: BigNumber,
  decimals: number
): BigNumber {
  if (decimals == DECIMAL_PLACES) {
    return amount;
  }

  const normalizedAmount = amount.shiftedBy(-1 * decimals);
  return scale(normalizedAmount, 12);
}
