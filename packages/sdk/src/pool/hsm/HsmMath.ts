import {
  calculate_collateral_in_given_hollar_out,
  calculate_collateral_out_given_hollar_in,
  calculate_hollar_in_given_collateral_out,
  calculate_hollar_out_given_collateral_in,
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
}
