import { PoolFee } from '../types';
import { BigNumber } from './bignumber';

export function toHuman(amount: BigNumber, decimals: number): string {
  return amount.shiftedBy(-1 * decimals).toString();
}

export function toPct(fee: PoolFee): number {
  return (fee[0] / fee[1]) * 100;
}

export function toPermill(fee: PoolFee): number {
  return fee[0] / fee[1];
}
