import { TradeScheduler } from './TradeScheduler';

import {
  DCA_TIME_RESERVE,
  TWAP_EXECUTION_INTERVAL_MS,
  TWAP_MAX_DURATION,
} from './const';

/** Nominal rate and floor of the 2s runtime */
const BLOCK_TIME = 2_000;
const MINIMAL_PERIOD = 15;

/** Nominal rate and floor of the 6s runtime, still live on mainnet */
const BLOCK_TIME_6S = 6_000;
const MINIMAL_PERIOD_6S = 5;

/** Shortest spacing the chain accepts, in ms */
const MIN_SPACING = BLOCK_TIME * MINIMAL_PERIOD;
const MIN_SPACING_6S = BLOCK_TIME_6S * MINIMAL_PERIOD_6S;

class TestScheduler extends TradeScheduler {
  public maxTradeCount(
    amountIn: bigint,
    amountInMin: bigint,
    duration: number
  ) {
    return this.getMaximumTradeCount(amountIn, amountInMin, duration);
  }
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('TradeScheduler.getMaximumTradeCount', () => {
  const routerMock: any = {};
  const scheduler = new TestScheduler(routerMock, {
    blockTime: BLOCK_TIME,
    minimalPeriod: MINIMAL_PERIOD,
  });

  it('returns 0 when amountInMin is 0 (minPerTrade becomes 0)', () => {
    const duration = HOUR;
    const amountInMin = 0n;
    const amountIn = 1_000n;

    const res = scheduler.maxTradeCount(amountIn, amountInMin, duration);
    expect(res).toBe(0);
  });

  it('caps by budget for long duration (1 day)', () => {
    const duration = DAY;
    const amountInMin = 100n; // minPerTrade=20
    const amountIn = 190n; // maxByBudget=9

    const res = scheduler.maxTradeCount(amountIn, amountInMin, duration);
    expect(res).toBe(9);
  });

  it('caps by time for 1 hour when budget is very large (time dominates)', () => {
    const duration = HOUR;
    const amountInMin = 100n;
    const amountIn = 10_000_000n;

    const maxByTimeRaw = Math.floor(duration / MIN_SPACING);
    const expected = Math.max(
      0,
      Math.floor(maxByTimeRaw * (1 - DCA_TIME_RESERVE))
    );

    const res = scheduler.maxTradeCount(amountIn, amountInMin, duration);
    expect(res).toBe(expected);

    /** the cap must be schedulable: every trade needs minimalPeriod blocks */
    expect(res * MIN_SPACING).toBeLessThanOrEqual(duration);
  });

  it('handles exact budget division', () => {
    const duration = DAY;
    const amountInMin = 100n; // minPerTrade=20
    const amountIn = 200n; // exactly 10 trade

    const res = scheduler.maxTradeCount(amountIn, amountInMin, duration);
    expect(res).toBe(10);
  });

  it('never exceeds budget-implied maximum trades', () => {
    const duration = DAY;
    const amountInMin = 100n; // minPerTrade=20
    const amountIn = 199n; // cap should be 9

    const minPerTrade = (amountInMin * 2n) / 10n;
    const maxByBudget = Number(amountIn / minPerTrade);

    const res = scheduler.maxTradeCount(amountIn, amountInMin, duration);
    expect(res).toBeLessThanOrEqual(maxByBudget);
  });

  it('never exceeds time-implied maximum trades', () => {
    const duration = HOUR;
    const amountInMin = 100n;
    const amountIn = 10_000_000n;

    const maxByTimeRaw = Math.floor(duration / MIN_SPACING);
    const maxByTime = Math.max(
      0,
      Math.floor(maxByTimeRaw * (1 - DCA_TIME_RESERVE))
    );

    const res = scheduler.maxTradeCount(amountIn, amountInMin, duration);
    expect(res).toBeLessThanOrEqual(maxByTime);
  });
});

class CadenceScheduler extends TradeScheduler {
  public toBlocks(periodMsec: number) {
    return this['toBlockPeriod'](periodMsec);
  }
}

const build = (blockTime: number, minimalPeriod = MINIMAL_PERIOD) =>
  new CadenceScheduler({} as any, { blockTime, minimalPeriod });

/**
 * The cadence must hold in WALL CLOCK, not in blocks.
 *
 * - The chain rejects a period below minimalPeriod blocks, so that floor caps
 *   how short an interval can be asked for
 * - Above the floor the requested duration is met; below it the floor governs,
 *   and every quote has to report the floor rather than what was asked
 */
describe('TradeScheduler cadence across block rates', () => {
  const TARGET = BLOCK_TIME;

  it('meets the requested twap interval', () => {
    const blocks = build(TARGET).toBlocks(TWAP_EXECUTION_INTERVAL_MS);

    expect(blocks).toBe(18);
    expect(blocks * TARGET).toBe(TWAP_EXECUTION_INTERVAL_MS);
  });

  it('floors a sub-minimum period at the chain minimum', () => {
    /** 20s is 10 blocks at 2s, under the 15 the chain accepts */
    expect(build(TARGET).toBlocks(20_000)).toBe(MINIMAL_PERIOD);
  });

  it('quotes the interval it actually scheduled', () => {
    const s = build(TARGET);
    const realized = 50 * s.toBlocks(TWAP_EXECUTION_INTERVAL_MS) * TARGET;

    expect(s.getTwapExecutionTime(50)).toBe(realized);
  });

  it('keeps the twap trade count within the max duration', () => {
    const s = build(TARGET);
    const count = s.getTwapTradeCount(500);
    const span = count * s.toBlocks(TWAP_EXECUTION_INTERVAL_MS) * TARGET;

    expect(span).toBeLessThanOrEqual(TWAP_MAX_DURATION);
  });

  it('converts a wall-clock dca period to the same duration', () => {
    expect(build(TARGET).toBlocks(HOUR) * TARGET).toBe(HOUR);
  });

  it('never returns a period under the chain minimum', () => {
    const at = build(TARGET);
    expect(at.toBlocks(1_000)).toBe(MINIMAL_PERIOD);
    expect(at.toBlocks(60_000)).toBe(30);
  });

  it('floors at the chain minimum, not a hardcoded 6', () => {
    expect(build(TARGET, 15).toBlocks(0)).toBe(15);
    expect(build(6_000, 5).toBlocks(0)).toBe(5);
  });
});

/**
 * The 6s runtime mainnet still serves.
 *
 * - The same wall-clock cadence must hold there, with its own floor
 * - Kept alongside the 2s cases until the upgrade lands everywhere
 */
describe('TradeScheduler cadence on the 6s runtime', () => {
  const scheduler = new TestScheduler({} as any, {
    blockTime: BLOCK_TIME_6S,
    minimalPeriod: MINIMAL_PERIOD_6S,
  });

  const cadence = build(BLOCK_TIME_6S, MINIMAL_PERIOD_6S);

  it('meets the requested twap interval', () => {
    const blocks = cadence.toBlocks(TWAP_EXECUTION_INTERVAL_MS);

    expect(blocks).toBe(6);
    expect(blocks * BLOCK_TIME_6S).toBe(TWAP_EXECUTION_INTERVAL_MS);
  });

  it('converts a wall-clock dca period to the same duration', () => {
    expect(cadence.toBlocks(HOUR) * BLOCK_TIME_6S).toBe(HOUR);
  });

  it('quotes the interval it actually scheduled', () => {
    const realized =
      50 * cadence.toBlocks(TWAP_EXECUTION_INTERVAL_MS) * BLOCK_TIME_6S;

    expect(cadence.getTwapExecutionTime(50)).toBe(realized);
  });

  it('keeps the twap trade count within the max duration', () => {
    const count = cadence.getTwapTradeCount(500);
    const span =
      count * cadence.toBlocks(TWAP_EXECUTION_INTERVAL_MS) * BLOCK_TIME_6S;

    expect(span).toBeLessThanOrEqual(TWAP_MAX_DURATION);
  });

  it('caps trade count by the shortest schedulable spacing', () => {
    const res = scheduler.maxTradeCount(10_000_000n, 100n, HOUR);

    expect(res).toBe(
      Math.floor(Math.floor(HOUR / MIN_SPACING_6S) * (1 - DCA_TIME_RESERVE))
    );

    /** the cap must be schedulable: every trade needs minimalPeriod blocks */
    expect(res * MIN_SPACING_6S).toBeLessThanOrEqual(HOUR);
  });
});
