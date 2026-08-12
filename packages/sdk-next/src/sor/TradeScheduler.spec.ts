import { TradeScheduler } from './TradeScheduler';

import { DCA_TIME_RESERVE, TWAP_EXECUTION_INTERVAL_MS } from './const';

const BLOCK_TIME = 6_000;

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
    minimalPeriod: 6,
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

    const maxByTimeRaw = Math.floor(duration / BLOCK_TIME);
    const expected = Math.max(
      0,
      Math.floor(maxByTimeRaw * (1 - DCA_TIME_RESERVE))
    );

    const res = scheduler.maxTradeCount(amountIn, amountInMin, duration);
    expect(res).toBe(expected);
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

    const maxByTimeRaw = Math.floor(duration / BLOCK_TIME);
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

const build = (blockTime: number, minimalPeriod = 6) =>
  new CadenceScheduler({} as any, { blockTime, minimalPeriod });

/**
 * The cadence must be invariant in WALL CLOCK, not in blocks: the same order
 * has to span the same time whatever the block rate is.
 */
describe('TradeScheduler cadence across block rates', () => {
  const SIX = 6_000;
  const TWO = 2_000;

  it('twap interval is the same duration at 6s and 2s', () => {
    const at6 = build(SIX);
    const at2 = build(TWO);

    const blocks6 = at6.toBlocks(TWAP_EXECUTION_INTERVAL_MS);
    const blocks2 = at2.toBlocks(TWAP_EXECUTION_INTERVAL_MS);

    expect(blocks6).toBe(6);
    expect(blocks2).toBe(18);

    expect(blocks6 * SIX).toBe(TWAP_EXECUTION_INTERVAL_MS);
    expect(blocks2 * TWO).toBe(TWAP_EXECUTION_INTERVAL_MS);
  });

  it('quotes the same twap execution time at any block rate', () => {
    expect(build(SIX).getTwapExecutionTime(50)).toBe(
      build(TWO).getTwapExecutionTime(50)
    );
    expect(build(SIX).getTwapExecutionTime(50)).toBe(50 * 36_000);
  });

  it('caps twap trade count identically at any block rate', () => {
    expect(build(SIX).getTwapTradeCount(500)).toBe(
      build(TWO).getTwapTradeCount(500)
    );
  });

  it('converts a wall-clock dca period to the same duration', () => {
    expect(build(SIX).toBlocks(HOUR) * SIX).toBe(HOUR);
    expect(build(TWO).toBlocks(HOUR) * TWO).toBe(HOUR);
  });

  it('never returns a period under the chain minimum', () => {
    // 2s chain raises DCA.MinimalPeriod to 15
    const at2 = build(TWO, 15);
    expect(at2.toBlocks(1_000)).toBe(15);
    expect(at2.toBlocks(60_000)).toBe(30);
  });

  it('floors at the chain minimum, not a hardcoded 6', () => {
    expect(build(TWO, 15).toBlocks(0)).toBe(15);
    expect(build(SIX, 5).toBlocks(0)).toBe(5);
  });
});
