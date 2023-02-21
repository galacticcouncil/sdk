import {
  calculate_in_given_out,
  calculate_out_given_in,
  calculate_pool_trade_fee,
  get_spot_price,
  calculate_liquidity_in,
  calculate_shares,
  calculate_liquidity_out_asset_a,
  calculate_liquidity_out_asset_b,
} from '@galacticcouncil/math-xyk';

export class XykMath {
  static getSpotPrice(balanceA: string, balanceB: string, amount: string): string {
    return get_spot_price(balanceA, balanceB, amount);
  }

  static calculateInGivenOut(balanceIn: string, balanceOut: string, amountOut: string): string {
    return calculate_in_given_out(balanceIn, balanceOut, amountOut);
  }

  static calculateOutGivenIn(balanceIn: string, balanceOut: string, amountIn: string): string {
    return calculate_out_given_in(balanceIn, balanceOut, amountIn);
  }

  static calculatePoolTradeFee(amount: string, feeNumerator: number, feeDenominator: number): string {
    return calculate_pool_trade_fee(amount, feeNumerator, feeDenominator);
  }

  static calculateLiquidityIn(reserveA: string, reserveB: string, amountA: string): string {
    return calculate_liquidity_in(reserveA, reserveB, amountA);
  }

  static calculateShares(reserveA: string, amountA: string, totalShares: string): string {
    return calculate_shares(reserveA, amountA, totalShares);
  }

  static calculateLiquidityOutAssetA(reserveA: string, reserveB: string, shares: string, totalShares: string): string {
    return calculate_liquidity_out_asset_a(reserveA, reserveB, shares, totalShares);
  }

  static calculateLiquidityOutAssetB(reserveA: string, reserveB: string, shares: string, totalShares: string): string {
    return calculate_liquidity_out_asset_b(reserveA, reserveB, shares, totalShares);
  }
}
