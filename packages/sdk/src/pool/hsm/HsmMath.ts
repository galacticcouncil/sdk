import {
  calculate_collateral_in_given_hollar_out,
  calculate_collateral_out_given_hollar_in,
  calculate_hollar_in_given_collateral_out,
  calculate_hollar_out_given_collateral_in,
  calculate_imbalance,
  calculate_max_price,
  calculate_buyback_limit,
  calculate_buyback_price_with_fee,
} from '@galacticcouncil/math-hsm';

export class HsmMath {
  static calculateCollateralInGivenHollarOut(
    amountOut: string,
    collateralPeg: string,
    purchaseFee: string
  ): string {
    return calculate_collateral_in_given_hollar_out(
      amountOut,
      collateralPeg,
      purchaseFee
    );
  }

  static calculateCollateralOutGivenHollarIn(
    amountIn: string,
    executionPrice: string,
    buybackFee: string
  ): string {
    return calculate_collateral_out_given_hollar_in(
      amountIn,
      executionPrice,
      buybackFee
    );
  }

  static calculateHollarOutGivenCollateralIn(
    amountIn: string,
    collateralPeg: string,
    purchaseFee: string
  ): string {
    return calculate_hollar_out_given_collateral_in(
      amountIn,
      collateralPeg,
      purchaseFee
    );
  }

  static calculateHollarInGivenCollateralOut(
    amountOut: string,
    executionPrice: string,
    buybackFee: string
  ): string {
    return calculate_hollar_in_given_collateral_out(
      amountOut,
      executionPrice,
      buybackFee
    );
  }

  /**
   * I_i = (H_i - peg_i * R_i) / 2
   *
   * If hollar reserve is less than pegged collateral, we're considering zero imbalance
   * as we only care about positive imbalance (excess Hollar in the pool
   *
   * @param hollarReserve
   * @param collateralPeg
   * @param collateralReserve
   * @returns pool imbalance or 0 if hollar reserve is less than pegged collateral
   */
  static calculateImbalance(
    hollarReserve: string,
    collateralPeg: string,
    collateralReserve: string
  ): string {
    return calculate_imbalance(hollarReserve, collateralPeg, collateralReserve);
  }

  static calculateBuybackLimit(imbalance: string, buybackRate: string): string {
    return calculate_buyback_limit(imbalance, buybackRate);
  }

  static calculateBuybackPriceWithFee(
    executionPriceNum: string,
    executionPriceDen: string,
    buyBackFee: string
  ): string {
    return calculate_buyback_price_with_fee(
      executionPriceNum,
      executionPriceDen,
      buyBackFee
    );
  }

  static calculateMaxPrice(collateralPeg: string, coeficient: string): string {
    return calculate_max_price(collateralPeg, coeficient);
  }
}
