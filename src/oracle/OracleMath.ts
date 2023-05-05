import { low_precision_iterated_price_ema, iterated_balance_ema } from '@galacticcouncil/math-ema';
import BigNumber from 'bignumber.js';
import { ZERO, bnum } from '../utils/bignumber';

export interface OracleEntry {
  price: [BigNumber, BigNumber];
  volume: BigNumber[];
  liquidity: [BigNumber, BigNumber];
  timestamp: BigNumber;
}

export interface LowPrecisionOracleEntry {
  price: BigNumber;
  volume: BigNumber[];
  liquidity: [BigNumber, BigNumber];
  timestamp: BigNumber;
}

export enum OraclePeriod {
  LastBlock = 'LastBlock',
  Short = 'Short',
  TenMinutes = 'TenMinutes',
  Hour = 'Hour',
  Day = 'Day',
  Week = 'Week',
}

export class EmaLowPrecisionMath {
  static iteratedPriceEma(
    iterations: string,
    prevN: string,
    prevD: string,
    incomingN: string,
    incomingD: string,
    smoothing: string
  ): string {
    return low_precision_iterated_price_ema(iterations, prevN, prevD, incomingN, incomingD, smoothing);
  }

  static iteratedBalanceEma(iterations: string, prev: string, incoming: string, smoothing: string): string {
    return iterated_balance_ema(iterations, prev, incoming, smoothing);
  }
}

export class OracleMath {
  // Smoothing factors for the currently supported oracle periods.
  // Taken from https://github.com/galacticcouncil/warehouse/blob/0047e9ceff47b2a058ae9ecc25da96d1e827a26a/ema-oracle/src/types.rs#L198-L207
  static readonly SmoothingForPeriod: Map<OraclePeriod, string> = new Map([
    [OraclePeriod.LastBlock, '170141183460469231731687303715884105728'],
    [OraclePeriod.Short, '34028236692093846346337460743176821146'],
    [OraclePeriod.TenMinutes, '3369132345751865974884897103284833777'],
    [OraclePeriod.Hour, '566193622164623067326746434994622648'],
    [OraclePeriod.Day, '23629079016800115510268356880200556'],
    [OraclePeriod.Week, '3375783642235081630771268215908257'],
  ]);

  /// Calculate the current oracle values from the `outdated` and `updateWith` values using the `smoothing` factor with the old values being `iterations` out of date.
  ///
  /// Note: The volume is always updated with zero values so it is not a parameter.
  static updateOutdatedToCurrent(
    outdated: OracleEntry,
    updateWith: OracleEntry,
    period: OraclePeriod
  ): LowPrecisionOracleEntry {
    if (outdated.timestamp >= updateWith.timestamp) {
      throw new Error('invalid timestamp (outdated should be older)');
    }
    let iterations = BigNumber.max(updateWith.timestamp.minus(outdated.timestamp), 0).toString();
    let smoothing = OracleMath.SmoothingForPeriod.get(period);
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
