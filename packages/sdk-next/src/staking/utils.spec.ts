import { calculatePeriodNumber, getAccountAddress } from './utils';

describe('staking utils', () => {
  it('should return correct address from seed', async () => {
    const result = getAccountAddress('0x7374616b696e6723');
    expect(result).toStrictEqual(
      '7L53bUSxyzrEVzb8VaVtehMs5DpWZ8UyydQHRB3xDq6GwwtF'
    );
  });
});

describe('calculatePeriodNumber', () => {
  // Test vectors ported 1:1 from hydra-dx-math (2s branch)
  // math/src/staking/tests.rs
  const U32_MAX = 4294967295n;

  describe('pre-2s eras (two-sec sentinel), matches legacy 3-arg math', () => {
    it.each([
      [1n, 12_341n, 12_341n, 12_341n],
      [1_000n, 12_341n, 12_342n, 12n],
      [1_000n, 1n, 1n, 0n],
      [82n, 12_341n, 12_341n, 150n],
      [41n, 12_341n, 5_001n, 211n],
      [2_617n, 678_789_789n, 89_789_124n, 146_843n],
    ])(
      'periodLength %s, block %s, sixSince %s -> %s',
      (periodLength, block, sixSince, expected) => {
        expect(
          calculatePeriodNumber(periodLength, block, sixSince, U32_MAX)
        ).toBe(expected);
      }
    );
  });

  describe('after the two-sec transition', () => {
    it.each([
      [100n, 10n],
      [200n, 15n],
      [259n, 15n],
      [260n, 16n],
    ])('block %s -> period %s', (block, expected) => {
      expect(calculatePeriodNumber(10n, block, 100n, 200n)).toBe(expected);
    });
  });

  it('falls back to legacy math when the two-sec anchor is invalid', () => {
    // twoSecBlocksSince <= sixSecBlocksSince -> 6s-era formula
    expect(calculatePeriodNumber(10n, 300n, 100n, 100n)).toBe(20n);
    expect(calculatePeriodNumber(10n, 300n, 100n, 50n)).toBe(20n);
  });
});
