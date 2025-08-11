import {
  calculate_in_given_out,
  calculate_lrna_in_given_out,
  calculate_out_given_in,
  calculate_out_given_lrna_in,
  calculate_spot_price,
  calculate_lrna_spot_price,
  calculate_shares,
  calculate_liquidity_out,
  calculate_liquidity_lrna_out,
  calculate_liquidity_hub_in,
  is_sell_allowed,
  is_buy_allowed,
  is_add_liquidity_allowed,
  is_remove_liquidity_allowed,
  recalculate_asset_fee,
  recalculate_protocol_fee,
  verify_asset_cap,
} from '@galacticcouncil/math-omnipool';

import { BigNumber } from '../../utils/bignumber';

export class OmniMath {
  static calculateSpotPrice(
    assetInBalance: string,
    assetInHubReserve: string,
    assetOutBalance: string,
    assetOutHubReserve: string
  ): string {
    return calculate_spot_price(
      assetInBalance,
      assetInHubReserve,
      assetOutBalance,
      assetOutHubReserve
    );
  }

  static calculateLrnaSpotPrice(
    assetBalance: string,
    assetHubReserve: string
  ): string {
    return calculate_lrna_spot_price(assetBalance, assetHubReserve);
  }

  static calculateInGivenOut(
    assetInBalance: string,
    assetInHubReserve: string,
    assetInShares: string,
    assetOutBalance: string,
    assetOutHubReserve: string,
    assetOutShares: string,
    amountOut: string,
    assetFee: string,
    protocolFee: string
  ): string {
    return calculate_in_given_out(
      assetInBalance,
      assetInHubReserve,
      assetInShares,
      assetOutBalance,
      assetOutHubReserve,
      assetOutShares,
      amountOut,
      assetFee,
      protocolFee
    );
  }

  static calculateLrnaInGivenOut(
    assetOutBalance: string,
    assetOutHubReserve: string,
    assetOutShares: string,
    amountOut: string,
    assetFee: string
  ): string {
    return calculate_lrna_in_given_out(
      assetOutBalance,
      assetOutHubReserve,
      assetOutShares,
      amountOut,
      assetFee
    );
  }

  static calculateOutGivenIn(
    assetInBalance: string,
    assetInHubReserve: string,
    assetInShares: string,
    assetOutBalance: string,
    assetOutHubReserve: string,
    assetOutShares: string,
    amountIn: string,
    assetFee: string,
    protocolFee: string
  ): string {
    return calculate_out_given_in(
      assetInBalance,
      assetInHubReserve,
      assetInShares,
      assetOutBalance,
      assetOutHubReserve,
      assetOutShares,
      amountIn,
      assetFee,
      protocolFee
    );
  }

  static calculateOutGivenLrnaIn(
    assetOutBalance: string,
    assetOutHubReserve: string,
    assetOutShares: string,
    amountOut: string,
    assetFee: string
  ): string {
    return calculate_out_given_lrna_in(
      assetOutBalance,
      assetOutHubReserve,
      assetOutShares,
      amountOut,
      assetFee
    );
  }

  static calculateShares(
    assetReserve: string,
    assetHubReserve: string,
    assetShares: string,
    amountIn: string
  ): string {
    return calculate_shares(
      assetReserve,
      assetHubReserve,
      assetShares,
      amountIn
    );
  }

  static calculateLiquidityOut(
    assetReserve: string,
    assetHubReserve: string,
    assetShares: string,
    positionAmount: string,
    positionShares: string,
    positionPrice: string,
    sharesToRemove: string,
    withdrawalFee: string
  ): string {
    return calculate_liquidity_out(
      assetReserve,
      assetHubReserve,
      assetShares,
      positionAmount,
      positionShares,
      positionPrice,
      sharesToRemove,
      withdrawalFee
    );
  }

  static calculateLiquidityLRNAOut(
    assetReserve: string,
    assetHubReserve: string,
    assetShares: string,
    positionAmount: string,
    positionShares: string,
    positionPrice: string,
    sharesToRemove: string,
    withdrawalFee: string
  ): string {
    return calculate_liquidity_lrna_out(
      assetReserve,
      assetHubReserve,
      assetShares,
      positionAmount,
      positionShares,
      positionPrice,
      sharesToRemove,
      withdrawalFee
    );
  }

  static calculateCapDifference(
    assetReserve: string,
    assetHubReserve: string,
    assetCap: string,
    totalHubReserve: string
  ): string {
    const qi = BigNumber(assetHubReserve);
    const ri = BigNumber(assetReserve);
    const q = BigNumber(totalHubReserve);
    const omegaI = BigNumber(assetCap);

    const percentage = omegaI.shiftedBy(-18);
    const isUnderWeightCap = qi.div(q).lt(percentage);

    if (isUnderWeightCap) {
      const numerator = percentage.times(q).minus(qi).times(ri);
      const denominator = qi.times(BigNumber(1).minus(percentage));
      return numerator.div(denominator).toFixed(0);
    } else {
      return '0';
    }
  }

  static calculateLimitHubIn(
    assetReserve: string,
    assetHubReserve: string,
    assetShares: string,
    amountIn: string
  ): string {
    return calculate_liquidity_hub_in(
      assetReserve,
      assetHubReserve,
      assetShares,
      amountIn
    );
  }

  static isSellAllowed(bits: number): boolean {
    return is_sell_allowed(bits);
  }

  static isBuyAllowed(bits: number): boolean {
    return is_buy_allowed(bits);
  }

  static isAddLiquidityAllowed(bits: number): boolean {
    return is_add_liquidity_allowed(bits);
  }

  static isRemoveLiquidityAllowed(bits: number): boolean {
    return is_remove_liquidity_allowed(bits);
  }

  static recalculateAssetFee(
    oracleAmountIn: string,
    oracleAmountOut: string,
    oracleLiquidity: string,
    oraclePeriod: string,
    currentAssetLiquidity: string,
    previousFee: string,
    blocDifference: string,
    minFee: string,
    maxFee: string,
    decay: string,
    amplification: string
  ): string {
    return recalculate_asset_fee(
      oracleAmountIn,
      oracleAmountOut,
      oracleLiquidity,
      oraclePeriod,
      currentAssetLiquidity,
      previousFee,
      blocDifference,
      minFee,
      maxFee,
      decay,
      amplification
    );
  }

  static recalculateProtocolFee(
    oracleAmountIn: string,
    oracleAmountOut: string,
    oracleLiquidity: string,
    oraclePeriod: string,
    currentAssetLiquidity: string,
    previousFee: string,
    blocDifference: string,
    minFee: string,
    maxFee: string,
    decay: string,
    amplification: string
  ): string {
    return recalculate_protocol_fee(
      oracleAmountIn,
      oracleAmountOut,
      oracleLiquidity,
      oraclePeriod,
      currentAssetLiquidity,
      previousFee,
      blocDifference,
      minFee,
      maxFee,
      decay,
      amplification
    );
  }

  static verifyAssetCap(
    assetReserve: string,
    assetCap: string,
    hubAdded: string,
    totalHubReserve: string
  ): boolean {
    return verify_asset_cap(assetReserve, assetCap, hubAdded, totalHubReserve);
  }
}
