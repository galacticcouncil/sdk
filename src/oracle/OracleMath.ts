import {
  iterated_price_ema,
  iterated_balance_ema,
} from '@galacticcouncil/math-ema';

export class EmaLowPrecisionMath {
  static iteratedPriceEma(iterations: string, prev_n: string, prev_d: string, incoming_n: string, incoming_d: string, smoothing: string): string {
    return iterated_price_ema(iterations, prev_n, prev_d, incoming_n, incoming_d, smoothing);
  }

  static iteratedBalanceEma(iterations: string, prev: string, incoming: string, smoothing: string): string {
    return iterated_balance_ema(iterations, prev, incoming, smoothing);
  }
}