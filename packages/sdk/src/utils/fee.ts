import { DENOMINATOR } from '../consts';
import { PoolFee } from '../pool';

export class FeeUtils {
  static toPct(fee: PoolFee): number {
    return (fee[0] / fee[1]) * 100;
  }

  static toDecimals(fee: PoolFee): number {
    return fee[0] / fee[1];
  }

  static fromPermill(permill: number): PoolFee {
    return [permill / DENOMINATOR, DENOMINATOR] as PoolFee;
  }
}
