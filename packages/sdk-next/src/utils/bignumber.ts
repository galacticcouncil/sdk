import { BigNumber } from 'bignumber.js';

export const DECIMAL_PLACES = 12;
export const ZERO = bnum(0);
export const ONE = bnum(1);
export const INFINITY = bnum('Infinity');

BigNumber.config({
  EXPONENTIAL_AT: [-100, 100],
  ROUNDING_MODE: 4,
  DECIMAL_PLACES: DECIMAL_PLACES,
});

export function scale(input: BigNumber, decimalPlaces: number): BigNumber {
  const scalePow = new BigNumber(decimalPlaces.toString());
  const scaleMul = new BigNumber(10).pow(scalePow);
  return input.times(scaleMul);
}

export function bnum(val: string | number | bigint | BigNumber): BigNumber {
  return new BigNumber(val.toString());
}

export { BigNumber };
