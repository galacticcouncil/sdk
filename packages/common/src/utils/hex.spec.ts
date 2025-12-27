import {
  isHex,
  stripHexPrefix,
  ensureHexPrefix,
  hexNormalize,
  assertHexLen,
} from './hex';

describe('Hex utils', () => {
  describe('isHex', () => {
    it('should return true for valid hex strings', () => {
      expect(isHex('0x')).toBe(true);
      expect(isHex('0x00')).toBe(true);
      expect(isHex('0x1234567890abcdef')).toBe(true);
      expect(isHex('0x1234567890ABCDEF')).toBe(true);
      expect(isHex('0xDeadBeef')).toBe(true);
    });

    it('should return false for invalid hex strings', () => {
      expect(isHex('')).toBe(false);
      expect(isHex('0x0')).toBe(false);
      expect(isHex('0x123')).toBe(false);
      expect(isHex('0')).toBe(false);
      expect(isHex('00')).toBe(false);
      expect(isHex('1234567890abcdef')).toBe(false);
      expect(isHex('0x123g')).toBe(false);
      expect(isHex('0xGG')).toBe(false);
      expect(isHex('not hex')).toBe(false);
      expect(isHex('0x 123')).toBe(false);
    });

    it('should validate even length by default', () => {
      expect(isHex('0x12')).toBe(true);
      expect(isHex('0x1234')).toBe(true);
      expect(isHex('0x1')).toBe(false);
      expect(isHex('0x123')).toBe(false);
    });

    it('should ignore length validation when ignoreLength is true', () => {
      expect(isHex('0x1', true)).toBe(true);
      expect(isHex('0x123', true)).toBe(true);
      expect(isHex('0x12345', true)).toBe(true);
    });
  });

  describe('stripHexPrefix', () => {
    it('should strip 0x prefix if present', () => {
      expect(stripHexPrefix('0x1234')).toBe('1234');
      expect(stripHexPrefix('0xabcdef')).toBe('abcdef');
      expect(stripHexPrefix('0xABCDEF')).toBe('ABCDEF');
    });

    it('should return string as-is if no 0x prefix', () => {
      expect(stripHexPrefix('1234')).toBe('1234');
      expect(stripHexPrefix('abcdef')).toBe('abcdef');
      expect(stripHexPrefix('')).toBe('');
    });
  });

  describe('ensureHexPrefix', () => {
    it('should add 0x prefix if missing', () => {
      expect(ensureHexPrefix('1234')).toBe('0x1234');
      expect(ensureHexPrefix('abcdef')).toBe('0xabcdef');
      expect(ensureHexPrefix('ABCDEF')).toBe('0xABCDEF');
      expect(ensureHexPrefix('')).toBe('0x');
    });

    it('should not add 0x prefix if already present', () => {
      expect(ensureHexPrefix('0x1234')).toBe('0x1234');
      expect(ensureHexPrefix('0xabcdef')).toBe('0xabcdef');
      expect(ensureHexPrefix('0xABCDEF')).toBe('0xABCDEF');
    });
  });

  describe('hexNormalize', () => {
    it('should normalize hex strings to lowercase with 0x prefix', () => {
      expect(hexNormalize('0xABCDEF')).toBe('0xabcdef');
      expect(hexNormalize('ABCDEF')).toBe('0xabcdef');
      expect(hexNormalize('0xDeadBeef')).toBe('0xdeadbeef');
      expect(hexNormalize('1234')).toBe('0x1234');
    });
  });

  describe('assertHexLen', () => {
    it('should not throw for valid hex strings with correct length', () => {
      expect(() => assertHexLen('0x1234', 2)).not.toThrow();
      expect(() => assertHexLen('0x12345678', 4)).not.toThrow();
      expect(() =>
        assertHexLen(
          '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
          32
        )
      ).not.toThrow();
    });

    it('should throw for hex strings with incorrect length', () => {
      expect(() => assertHexLen('0x1234', 4)).toThrow(
        'Expected 0x hex of 4 bytes'
      );
      expect(() => assertHexLen('0x12', 2)).toThrow('Expected 0x hex of 2 bytes');
      expect(() => assertHexLen('0x123456', 4)).toThrow(
        'Expected 0x hex of 4 bytes'
      );
    });

    it('should throw for invalid hex strings', () => {
      expect(() => assertHexLen('1234', 2)).toThrow();
      expect(() => assertHexLen('0xGG', 1)).toThrow();
    });
  });
});
