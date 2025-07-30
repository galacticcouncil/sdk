import { BigNumber } from 'bignumber.js';

export const DECIMAL_PLACES = 12;

BigNumber.config({
  EXPONENTIAL_AT: [-100, 100],
  ROUNDING_MODE: 4,
  DECIMAL_PLACES: DECIMAL_PLACES,
});

export const ZERO = bnum(0);
export const ONE = bnum(1);
export const INFINITY = bnum('Infinity');

export function scale(input: BigNumber, decimalPlaces: number): BigNumber {
  const scalePow = new BigNumber(decimalPlaces.toString());
  const scaleMul = new BigNumber(10).pow(scalePow);
  return input.times(scaleMul).decimalPlaces(4);
}

export function bnum(val: string | number | bigint | BigNumber): BigNumber {
  return new BigNumber(val.toString());
}

export function toBn(amount: string | number, decimals: number): BigNumber {
  const input = bnum(amount);
  return scale(input, decimals);
}

export function toDecimals(amount: BigNumber, decimals: number): string {
  return amount.shiftedBy(-1 * decimals).toString();
}

export { BigNumber };
