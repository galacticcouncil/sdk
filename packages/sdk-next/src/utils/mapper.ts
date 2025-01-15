import { BigNumber } from './bignumber';
import { DENOMINATOR } from '../consts';
import { PoolFee } from '../types';

export function toHuman(amount: BigNumber, decimals: number): string {
  return amount.shiftedBy(-1 * decimals).toString();
}

export function toPct(fee: PoolFee): number {
  return (fee[0] / fee[1]) * 100;
}

export function toDecimals(fee: PoolFee): number {
  return fee[0] / fee[1];
}

export function toPoolFee(permill: number): PoolFee {
  return [permill / DENOMINATOR, DENOMINATOR] as PoolFee;
}
