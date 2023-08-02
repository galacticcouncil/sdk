import { calculatePriceImpact } from '../../src/utils/math';
import { BigNumber, ZERO, bnum } from '../../src/utils//bignumber';

describe('Calculate Price Impact', () => {
  beforeEach(() => {});

  it('Calculate price impact should be 0%', () => {
    const amount: BigNumber = bnum(100);
    const decimals: number = 0;
    const spotPrice: BigNumber = bnum(2);
    const calculatedAmount: BigNumber = bnum(200);
    const result = calculatePriceImpact(amount, decimals, spotPrice, calculatedAmount);
    expect(result).toStrictEqual(ZERO);
  });

  it('Calculate price impact should be 120%', () => {
    const amount: BigNumber = bnum(100);
    const decimals: number = 0;
    const spotPrice: BigNumber = bnum(2);
    const calculatedAmount: BigNumber = bnum(50);
    const result = calculatePriceImpact(amount, decimals, spotPrice, calculatedAmount);
    expect(result).toStrictEqual(bnum(120));
  });
});
