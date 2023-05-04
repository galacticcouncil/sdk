import { EmaLowPrecisionMath } from '../../src/oracle';
import { BigNumber, bnum } from '../../src/utils/bignumber';

function smoothingFromPeriod(period: number): BigNumber {
  return bnum(2).pow(127).multipliedBy(2).dividedBy(period + 1)
}

describe('Ema Math', () => {

  it('Should return correct EMA for given params', async () => {
    let smoothing = smoothingFromPeriod(7);
    let startPriceN = bnum(4);
    let startPriceD = bnum(1);
    let incomingPriceN = bnum(8);
    let incomingPriceD = bnum(1);
    let iterations = bnum(1);
    let nextPrice = EmaLowPrecisionMath.iteratedPriceEma(iterations.toString(), startPriceN.toString(), startPriceD.toString(), incomingPriceN.toString(), incomingPriceD.toString(), smoothing.toString());
    let expected = bnum(5).multipliedBy(bnum("1000000000000000000"));
    expect(bnum(nextPrice)).toStrictEqual(expected);
  });
});
