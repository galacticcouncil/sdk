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
