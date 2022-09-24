import { BigNumber } from './bignumber';

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
