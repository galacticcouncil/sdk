import { bnum } from './bignumber';

import { DENOMINATOR } from '../consts';
import { PoolFee } from '../pool';

export function toHuman(amount: bigint, decimals: number): string {
  return bnum(amount)
    .shiftedBy(-1 * decimals)
    .toString();
}

export function toPct(fee: PoolFee): number {
  const [numerator, denominator] = fee;
  return (numerator / denominator) * 100;
}

export function toDecimals(fee: PoolFee): number {
  const [numerator, denominator] = fee;
  return numerator / denominator;
}

export function toPoolFee(permill: number): PoolFee {
  return [permill / DENOMINATOR, DENOMINATOR] as PoolFee;
}
