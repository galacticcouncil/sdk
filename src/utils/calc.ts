import { BigNumber, bnum, scale } from "./bignumber";

export enum TradeType {
  Buy,
  Sell,
}

export function applyTradeFee(
  amount: BigNumber,
  tradeFee: BigNumber,
  tradeType: TradeType
): BigNumber {
  const fee = amount.multipliedBy(tradeFee);
  return tradeType === TradeType.Buy ? amount.plus(fee) : amount.minus(fee);
}

export function normalizeAmount(amount: BigNumber, decimals: number): BigNumber {
  if (decimals == 12) {
    return amount;
  }

  const normalizedAmount = amount.shiftedBy(-1 * decimals);
  return scale(normalizedAmount, 12);
}

export function feeValue(percentage: string): BigNumber {
  return bnum(parseFloat(percentage) / 100);
}
