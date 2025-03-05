import Big from 'big.js';
import { toBigInt, toDecimal } from './big';

describe('Big utils', () => {
  describe('toDecimals', () => {
    it('should convert to decimals with 18 decimals', () => {
      expect(toDecimal(1_678_578_001_143_648_100n, 18)).toBe('1.678578');
      expect(toDecimal(4_778_448_942_696_649_000n, 18, 0)).toBe('5');
      expect(toDecimal(9_277_414_529_928_219_000n, 18, 1)).toBe('9.3');
      expect(toDecimal(1_489_926_767_190_488_000n, 18, 2)).toBe('1.49');
      expect(toDecimal(7_111_587_933_365_016_000n, 18, 3)).toBe('7.112');
      expect(toDecimal(7_111_587_933_365_016_000n, 18, 18)).toBe(
        '7.111587933365016'
      );
      expect(toDecimal(4756503344577211177520n, 18, 18)).toBe(
        '4756.50334457721117752'
      );
      expect(toDecimal(198_000_012_317_550_812n, 18, 18)).toBe(
        '0.198000012317550812'
      );
    });

    it('should convert to decimals with 12 decimals', () => {
      expect(toDecimal(52_912_391_280_480n, 12)).toBe('52.912391');
      expect(toDecimal(796_301_020_21449n, 12, 0)).toBe('80');
      expect(toDecimal(370_024_965_982_774n, 12, 1)).toBe('370');
      expect(toDecimal(776_879_141_948n, 12, 2)).toBe('0.78');
      expect(toDecimal(372_209_875_392n, 12, 3)).toBe('0.372');
      expect(toDecimal(372_209_875_392n, 12, 12)).toBe('0.372209875392');
    });

    it('should convert to decimals with the correct rounding types', () => {
      expect(toDecimal(370_024_965_982_774n, 12, 1, Big.roundDown)).toBe('370');
    });
  });

  describe('toBigInt', () => {
    it('should convert to BigInt', () => {
      expect(toBigInt('1.678578', 18)).toBe(1_678_578_000_000_000_000n);
      expect(toBigInt('5', 18)).toBe(5_000_000_000_000_000_000n);
      expect(toBigInt('9.3', 18)).toBe(9_300_000_000_000_000_000n);
      expect(toBigInt('1.49', 18)).toBe(1_490_000_000_000_000_000n);
      expect(toBigInt('7.112', 18)).toBe(7_112_000_000_000_000_000n);
      expect(toBigInt('7.111587933365016', 18)).toBe(
        7_111_587_933_365_016_000n
      );
    });

    it('should convert to BigInt with 12 decimals', () => {
      expect(toBigInt('52.912391', 12)).toBe(52_912_391_000_000n);
      expect(toBigInt('80', 12)).toBe(80_000_000_000_000n);
      expect(toBigInt('370', 12)).toBe(370_000_000_000_000n);
      expect(toBigInt('0.78', 12)).toBe(780_000_000_000n);
      expect(toBigInt('0.372', 12)).toBe(372_000_000_000n);
      expect(toBigInt('0.372209875392', 12)).toBe(372_209_875_392n);
    });

    it('should convert to BigInt from number', () => {
      expect(toBigInt(52.912391, 12)).toBe(52_912_391_000_000n);
      expect(toBigInt(80, 12)).toBe(80_000_000_000_000n);
      expect(toBigInt(370, 12)).toBe(370_000_000_000_000n);
      expect(toBigInt(0.78, 12)).toBe(780_000_000_000n);
      expect(toBigInt(0.372, 12)).toBe(372_000_000_000n);
      expect(toBigInt(0.372209875392, 12)).toBe(372_209_875_392n);
      expect(toBigInt('4756.50334457721117752', 18)).toBe(
        4_756_503_344_577_211_177_520n
      );
      expect(toBigInt('66712.0367386073069948646', 18)).toBe(
        66_712_036_738_607_306_994_864n
      );
    });
  });
});
