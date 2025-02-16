import { calculateDiffToAvg, calculateDiffToRef } from './math';

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
    const result = calculateDiffToRef(100n, 1000n);
    expect(result).toStrictEqual(-90);
  });
});
