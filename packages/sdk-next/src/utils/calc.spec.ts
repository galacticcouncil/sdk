import { mulScaled, mulSpot, getFraction } from './calc';

describe('calc bigint helpers', () => {
  describe('mulScaled', () => {
    it('divides when exp > 0 (typical swap case)', () => {
      // 1.0 (12dp) * 2.0 (18dp) -> target 12dp
      const value = 10n ** 12n;
      const multiplier = 2n * 10n ** 18n;

      const out = mulScaled(value, multiplier, 12, 18, 12);
      expect(out).toBe(2n * 10n ** 12n);
    });

    it('no scaling when exp == 0', () => {
      // 7.0 (6dp) * 3.0 (12dp) -> target 18dp
      const value = 7n * 10n ** 6n;
      const multiplier = 3n * 10n ** 12n;

      const out = mulScaled(value, multiplier, 6, 12, 18);
      expect(out).toBe(21n * 10n ** 18n);
    });

    it('multiplies when exp < 0 (scale up, but ≤ 18dp)', () => {
      // 1.0 (6dp) * 2.0 (6dp) -> target 18dp
      const value = 1n * 10n ** 6n;
      const multiplier = 2n * 10n ** 6n;

      const out = mulScaled(value, multiplier, 6, 6, 18);
      expect(out).toBe(2n * 10n ** 18n);
    });

    it('floors result on division (BigInt truncation)', () => {
      // 1.234567 (6dp) * 1.000001 (6dp) -> target 6dp
      const value = 1_234_567n;
      const multiplier = 1_000_001n;

      const out = mulScaled(value, multiplier, 6, 6, 6);
      expect(out).toBe(1_234_568n);
    });

    it('handles zero safely', () => {
      expect(mulScaled(0n, 123n, 6, 6, 6)).toBe(0n);
      expect(mulScaled(123n, 0n, 6, 6, 6)).toBe(0n);
    });
  });

  describe('mulSpot', () => {
    it('uses RUNTIME_DECIMALS = 18 for spot math', () => {
      // 5.0 (12dp) * 2.0 (18dp) -> target 12dp
      const value = 5n * 10n ** 12n;
      const spot = 2n * 10n ** 18n;

      const out = mulSpot(value, spot, 12, 12);
      expect(out).toBe(10n * 10n ** 12n);
    });

    it('mulSpot scaling up to 18 decimals', () => {
      // 2.0 (6dp) * 3.0 (18dp) -> target 18dp
      const value = 2n * 10n ** 6n;
      const spot = 3n * 10n ** 18n;

      const out = mulSpot(value, spot, 6, 18);
      expect(out).toBe(6n * 10n ** 18n);
    });
  });

  describe('getFraction', () => {
    it('get 0.1% from given amount', () => {
      const result = getFraction(1_000_000_000n, 0.1);
      expect(result).toStrictEqual(1_000_000n);
    });
  });
});
