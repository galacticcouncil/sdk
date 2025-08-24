import Big from 'big.js';
import { PoolFee } from '../pool';

const DENOMINATOR = 1000;

export function toPct(fee: PoolFee): number {
  const [numerator, denominator] = fee;
  return (numerator / denominator) * 100;
}

export function toDecimals(fee: PoolFee): number {
  const [numerator, denominator] = fee;
  return numerator / denominator;
}

export function fromPermill(permill: number): PoolFee {
  return [permill / DENOMINATOR, DENOMINATOR] as PoolFee;
}

export function shiftNeg(
  amount: string | number | bigint,
  decimals: number
): string {
  const amountBig = Big(
    typeof amount === 'bigint' ? amount.toString() : amount
  );

  if (decimals === 0) {
    return amountBig.toString();
  }

  return amountBig.div(Math.pow(10, decimals)).toString();
}
