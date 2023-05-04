import { low_precision_iterated_price_ema, iterated_balance_ema } from '@galacticcouncil/math-ema';

export class EmaLowPrecisionMath {
  // Smoothing factors for the currently supported oracle periods.
  static readonly LastBlock: string = '170141183460469231731687303715884105728';
  static readonly Short: string = '34028236692093846346337460743176821146';
  static readonly TenMinutes: string = '3369132345751865974884897103284833777';
  static readonly Hour: string = '566193622164623067326746434994622648';
  static readonly Day: string = '23629079016800115510268356880200556';
  static readonly Week: string = '3375783642235081630771268215908257';

  static iteratedPriceEma(
    iterations: string,
    prev_n: string,
    prev_d: string,
    incoming_n: string,
    incoming_d: string,
    smoothing: string
  ): string {
    return low_precision_iterated_price_ema(iterations, prev_n, prev_d, incoming_n, incoming_d, smoothing);
  }

  static iteratedBalanceEma(iterations: string, prev: string, incoming: string, smoothing: string): string {
    return iterated_balance_ema(iterations, prev, incoming, smoothing);
  }
}
