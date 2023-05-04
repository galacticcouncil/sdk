import { EmaLowPrecisionMath } from '../../src/oracle';
import { BigNumber, bnum } from '../../src/utils/bignumber';

function smoothingFromPeriod(period: number): BigNumber {
  return bnum(2)
    .pow(127)
    .multipliedBy(2)
    .dividedBy(period + 1);
}

describe('EMA Math', () => {
  it('Should return correct price EMA for simple params', async () => {
    let smoothing = smoothingFromPeriod(7);
    let startPriceN = bnum(4);
    let startPriceD = bnum(1);
    let incomingPriceN = bnum(8);
    let incomingPriceD = bnum(1);
    let iterations = bnum(1);
    let nextPrice = EmaLowPrecisionMath.iteratedPriceEma(
      iterations.toString(),
      startPriceN.toString(),
      startPriceD.toString(),
      incomingPriceN.toString(),
      incomingPriceD.toString(),
      smoothing.toString()
    );
    let expected = bnum(5).multipliedBy(bnum('1000000000000000000'));
    expect(bnum(nextPrice)).toStrictEqual(expected);
  });

  it('Should return correct price EMA for hard-coded period', async () => {
    let smoothing = EmaLowPrecisionMath.Short;
    let startPriceN = bnum('100');
    let startPriceD = bnum(1);
    let incomingPriceN = bnum('1100');
    let incomingPriceD = bnum(1);
    let iterations = bnum(1);
    let nextPrice = EmaLowPrecisionMath.iteratedPriceEma(
      iterations.toString(),
      startPriceN.toString(),
      startPriceD.toString(),
      incomingPriceN.toString(),
      incomingPriceD.toString(),
      smoothing.toString()
    );
    let expected = bnum('300').multipliedBy(bnum('1000000000000000000'));
    expect(bnum(nextPrice)).toStrictEqual(expected);
  });

  it('Should return correct balance EMA for hard-coded period', async () => {
    let smoothing = EmaLowPrecisionMath.Short;
    let startBalance = bnum('100000000');
    let incomingBalance = bnum('1100000000');
    let iterations = bnum(1);
    let nextPrice = EmaLowPrecisionMath.iteratedBalanceEma(
      iterations.toString(),
      startBalance.toString(),
      incomingBalance.toString(),
      smoothing.toString()
    );
    let expected = bnum('300000000');
    expect(bnum(nextPrice)).toStrictEqual(expected);
  });
});
