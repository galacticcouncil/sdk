import { PERMILL_DENOMINATOR } from '../consts';
import { PoolFee } from '../pool';

export class FeeUtils {
  static toPct(fee: PoolFee): number {
    const [nom, denom] = fee;
    return FeeUtils.safeDivide(nom * 100, denom);
  }

  static toRaw(fee: PoolFee): number {
    const [nom, denom] = fee;
    return FeeUtils.safeDivide(nom, denom);
  }

  static fromPermill(permill: number): PoolFee {
    return [permill, PERMILL_DENOMINATOR] as PoolFee;
  }

  static fromRate(numerator: number, denominator: number): PoolFee {
    return [numerator, denominator] as PoolFee;
  }

  static safeDivide(
    numerator: number,
    denominator: number,
    decimals = 12
  ): number {
    const factor = 10 ** decimals;
    return Math.round((numerator * factor) / denominator) / factor;
  }

  static safeRound(value: number): number {
    return parseFloat(value.toPrecision(15));
  }
}
