import { TradeScheduler } from './TradeScheduler';

import { DCA_TIME_RESERVE, DEFAULT_BLOCK_TIME } from './const';

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
  const scheduler = new TestScheduler(routerMock);

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

    const maxByTimeRaw = Math.floor(duration / DEFAULT_BLOCK_TIME);
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

    const maxByTimeRaw = Math.floor(duration / DEFAULT_BLOCK_TIME);
    const maxByTime = Math.max(
      0,
      Math.floor(maxByTimeRaw * (1 - DCA_TIME_RESERVE))
    );

    const res = scheduler.maxTradeCount(amountIn, amountInMin, duration);
    expect(res).toBeLessThanOrEqual(maxByTime);
  });
});
