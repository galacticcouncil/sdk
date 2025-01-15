import { calculateDiffToAvg, calculateDiffToRef } from '../../src/utils/math';
import { BigNumber, ZERO, bnum } from '../../src/utils/bignumber';

describe('Calculate Percentage Difference', () => {
  beforeEach(() => {});

  it('Calculate difference (avg) should be 0%', () => {
    const a1: BigNumber = bnum(200);
    const a2: BigNumber = bnum(200);
    const result = calculateDiffToAvg(a1, a2);
    expect(result).toStrictEqual(ZERO);
  });

  it('Calculate difference (avg) should be 120%', () => {
    const a1: BigNumber = bnum(200);
    const a2: BigNumber = bnum(50);
    const result = calculateDiffToAvg(a1, a2);
    expect(result).toStrictEqual(bnum(120));
  });

  it('Calculate difference (avg) should be 200%', () => {
    const a1: BigNumber = bnum(200);
    const a2: BigNumber = bnum(0);
    const result = calculateDiffToAvg(a1, a2);
    expect(result).toStrictEqual(bnum(200));
  });

  it('Calculate difference (ref) should be 0%', () => {
    const aFin: BigNumber = bnum(100);
    const aRef: BigNumber = bnum(100);
    const result = calculateDiffToRef(aFin, aRef);
    expect(result).toStrictEqual(ZERO);
  });

  it('Calculate difference (ref) should be -50%', () => {
    const aFin: BigNumber = bnum(100);
    const aRef: BigNumber = bnum(200);
    const result = calculateDiffToRef(aFin, aRef);
    expect(result).toStrictEqual(bnum(-50));
  });

  it('Calculate difference (ref) should be -90%', () => {
    const aFin: BigNumber = bnum(100);
    const aRef: BigNumber = bnum(1000);
    const result = calculateDiffToRef(aFin, aRef);
    expect(result).toStrictEqual(bnum(-90));
  });
});
