import { BigNumber, ONE } from './bignumber';

/**
 * Percentage Difference Formula
 *
 * (|𝑉1−𝑉2| / [(𝑉1+𝑉2)/2]) × 100
 *
 * @param amount - Amount of asset in/out
 * @param decimals - Decimals of given asset
 * @param spotPrice - Spot price
 * @param calculatedAmount - Calculated amount of asset out/in
 * @returns Price impact percentage
 */
export function calculatePriceImpact(
  amount: BigNumber,
  decimals: number,
  spotPrice: BigNumber,
  calculatedAmount: BigNumber
): BigNumber {
  const v1 = amount.shiftedBy(-1 * decimals).multipliedBy(spotPrice);
  const v2 = calculatedAmount;
  const impact = v1.minus(v2).abs().div(v1.plus(v2).div(2)).multipliedBy(100);
  return impact.decimalPlaces(2);
}

/**
 * The total fee paid for a ‘sell’ transaction
 * Suppose the trader is selling X for Y
 *
 * fee = 1 - (deltaY / delta0Y)
 *
 * @param delta0Y - the amount out if fees are zero
 * @param deltaY - the amount out if the existing nonzero fees are included in the calculation
 */
export function calculateSellFee(delta0Y: BigNumber, deltaY: BigNumber) {
  const total = ONE.minus(deltaY.div(delta0Y));
  //return total.decimalPlaces(2);
  return total.multipliedBy(100).decimalPlaces(2);
}

/**
 * The total fee paid for a buy transaction
 * Suppose the trader is buying Y using X
 *
 * fee = (deltaX / delta0X) - 1
 *
 * @param delta0X - the amount in if fees are zero
 * @param deltaX - the amount in, inclusive of fees
 */
export function calculateBuyFee(delta0X: BigNumber, deltaX: BigNumber) {
  const total = deltaX.div(delta0X).minus(ONE);
  //return total.decimalPlaces(2);
  return total.multipliedBy(100).decimalPlaces(2);
}
