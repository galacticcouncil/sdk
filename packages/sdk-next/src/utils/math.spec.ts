import {
  calculateBuyFee,
  calculateDiffToAvg,
  calculateDiffToRef,
  calculateSellFee,
  getFraction,
} from './math';

describe('Calculate Percentage Difference', () => {
  beforeEach(() => {});

  it('Calculate difference (avg) should be 0%', () => {
    const result = calculateDiffToAvg(200n, 200n);
    expect(result).toStrictEqual(0);
  });

  it('Calculate difference (avg) should be 120%', () => {
    const result = calculateDiffToAvg(200n, 50n);
    expect(result).toStrictEqual(120);
  });

  it('Calculate difference (avg) should be 200%', () => {
    const result = calculateDiffToAvg(200n, 0n);
    expect(result).toStrictEqual(200);
  });

  it('Calculate difference (ref) should be 0%', () => {
    const result = calculateDiffToRef(100n, 100n);
    expect(result).toStrictEqual(0);
  });

  it('Calculate difference (ref) should be -50%', () => {
    const result = calculateDiffToRef(100n, 200n);
    expect(result).toStrictEqual(-50);
  });

  it('Calculate difference (ref) should be -90%', () => {
    const result = calculateDiffToRef(100n, 1_000n);
    expect(result).toStrictEqual(-90);
  });

  it('Calculate sell fee should be -10%', () => {
    const result = calculateSellFee(1_000n, 1_100n);
    expect(result).toStrictEqual(-10);
  });

  it('Calculate buy fee should be 10%', () => {
    const result = calculateBuyFee(1_000n, 1_100n);
    expect(result).toStrictEqual(10);
  });

  it('Calculate 0.1% from given amount should be 1000000n', () => {
    const result = getFraction(1_000_000_000n, 0.1);
    expect(result).toStrictEqual(1_000_000n);
  });
});
