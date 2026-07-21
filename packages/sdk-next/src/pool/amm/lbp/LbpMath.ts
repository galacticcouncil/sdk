import {
  calculate_in_given_out,
  calculate_out_given_in,
  calculate_linear_weights,
  calculate_pool_trade_fee,
  get_spot_price,
} from '@galacticcouncil/math-lbp';

export class LbpMath {
  static getSpotPrice(
    balanceA: string,
    balanceB: string,
    weightA: string,
    weightB: string,
    amount: string
  ): string {
    return get_spot_price(balanceA, balanceB, weightA, weightB, amount);
  }

  static calculateInGivenOut(
    balanceIn: string,
    balanceOut: string,
    weightIn: string,
    weightOut: string,
    amountOut: string
  ): string {
    return calculate_in_given_out(
      balanceIn,
      balanceOut,
      weightIn,
      weightOut,
      amountOut
    );
  }

  static calculateOutGivenIn(
    balanceIn: string,
    balanceOut: string,
    weightIn: string,
    weightOut: string,
    amountIn: string
  ): string {
    return calculate_out_given_in(
      balanceIn,
      balanceOut,
      weightIn,
      weightOut,
      amountIn
    );
  }

  static calculateLinearWeights(
    start: string,
    end: string,
    initialWeight: string,
    finalWeight: string,
    at: string
  ): string {
    return calculate_linear_weights(start, end, initialWeight, finalWeight, at);
  }

  static calculatePoolTradeFee(
    amount: string,
    feeNumerator: number,
    feeDenominator: number
  ): string {
    return calculate_pool_trade_fee(amount, feeNumerator, feeDenominator);
  }
}
