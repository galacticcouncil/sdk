import { low_precision_iterated_price_ema, iterated_balance_ema } from '@galacticcouncil/math-ema';
import BigNumber from 'bignumber.js';
import { ZERO, bnum } from '../utils/bignumber';

interface OracleEntry {
  price: [BigNumber, BigNumber];
  volume: BigNumber[];
  liquidity: [BigNumber, BigNumber];
  timestamp: BigNumber;
}

interface LowPrecisionOracleEntry {
  price: BigNumber;
  volume: BigNumber[];
  liquidity: [BigNumber, BigNumber];
  timestamp: BigNumber;
}

type OraclePeriod = 'LastBlock' | 'Short' | 'TenMinutes' | 'Hour' | 'Day' | 'Week';

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

export class OracleMath {
  static readonly SmoothingForPeriod: Map<string, string> = new Map([
    ['LastBlock', EmaLowPrecisionMath.LastBlock],
    ['Short', EmaLowPrecisionMath.Short],
    ['TenMinutes', EmaLowPrecisionMath.TenMinutes],
    ['Hour', EmaLowPrecisionMath.Hour],
    ['Day', EmaLowPrecisionMath.Day],
    ['Week', EmaLowPrecisionMath.Week],
  ]);

  /// Calculate the current oracle values from the `outdated` and `update_with` values using the `smoothing` factor with the old values being `iterations` out of date.
  ///
  /// Note: The volume is always updated with zero values so it is not a parameter.
  static updateOutdatedToCurrent(
    outdated: OracleEntry,
    updateWith: OracleEntry,
    period: OraclePeriod
  ): LowPrecisionOracleEntry {
    if (outdated.timestamp > updateWith.timestamp) {
      throw new Error('invalid timestamp');
    }
    let iterations = BigNumber.max(updateWith.timestamp.minus(outdated.timestamp), 0).toString();
    let smoothing = OracleMath.SmoothingForPeriod[period];
    let [prevN, prevD] = outdated.price;
    let [incomingN, incomingD] = updateWith.price;
    let price = bnum(
      EmaLowPrecisionMath.iteratedPriceEma(
        iterations,
        prevN.toString(),
        prevD.toString(),
        incomingN.toString(),
        incomingD.toString(),
        smoothing
      )
    );
    let volume = outdated.volume.map((v) =>
      bnum(EmaLowPrecisionMath.iteratedBalanceEma(iterations, v.toString(), ZERO.toString(), smoothing))
    );
    let [prevLiq1, prevLiq2] = outdated.liquidity;
    let [incomingLiq1, incomingLiq2] = updateWith.liquidity;
    let liquidity: [BigNumber, BigNumber] = [
      bnum(EmaLowPrecisionMath.iteratedBalanceEma(iterations, prevLiq1.toString(), incomingLiq1.toString(), smoothing)),
      bnum(EmaLowPrecisionMath.iteratedBalanceEma(iterations, prevLiq2.toString(), incomingLiq2.toString(), smoothing)),
    ];
    return { price, volume, liquidity, timestamp: updateWith.timestamp };
  }
}
