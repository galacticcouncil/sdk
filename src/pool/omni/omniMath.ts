import {
  calculate_in_given_out,
  calculate_out_given_in,
  calculate_pool_trade_fee,
  calculate_spot_price,
  calculate_shares,
  calculate_liquidity_out,
  calculate_liquidity_lrna_out,
  calculate_cap_difference,
  verify_asset_cap,
  calculate_liquidity_hub_in,
  is_sell_allowed,
  is_buy_allowed,
  is_add_liquidity_allowed,
  is_remove_liquidity_allowed,
} from '@galacticcouncil/math-omnipool';

function calculateSpotPrice(
  assetInBalance: string,
  assetInHubReserve: string,
  assetOutBalance: string,
  assetOutHubReserve: string
): string {
  return calculate_spot_price(assetInBalance, assetInHubReserve, assetOutBalance, assetOutHubReserve);
}

function calculateInGivenOut(
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

function calculateOutGivenIn(
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

function calculatePoolTradeFee(amount: string, feeNumerator: number, feeDenominator: number): string {
  return calculate_pool_trade_fee(amount, feeNumerator, feeDenominator);
}

function calculateShares(assetReserve: string, assetHubReserve: string, assetShares: string, amountIn: string): string {
  return calculate_shares(assetReserve, assetHubReserve, assetShares, amountIn);
}

function calculateLiquidityOut(
  assetReserve: string,
  assetHubReserve: string,
  assetShares: string,
  positionAmount: string,
  positionShares: string,
  positionPrice: string,
  sharesToRemove: string
): string {
  return calculate_liquidity_out(
    assetReserve,
    assetHubReserve,
    assetShares,
    positionAmount,
    positionShares,
    positionPrice,
    sharesToRemove
  );
}

function calculateLiquidityLRNAOut(
  assetReserve: string,
  assetHubReserve: string,
  assetShares: string,
  positionAmount: string,
  positionShares: string,
  positionPrice: string,
  sharesToRemove: string
): string {
  return calculate_liquidity_lrna_out(
    assetReserve,
    assetHubReserve,
    assetShares,
    positionAmount,
    positionShares,
    positionPrice,
    sharesToRemove
  );
}

function calculateCapDifference(
  assetReserve: string,
  assetHubReserve: string,
  assetCap: string,
  totalHubReserve: string
): string {
  return calculate_cap_difference(assetReserve, assetHubReserve, assetCap, totalHubReserve);
}

function verifyAssetCap(assetReserve: string, assetCap: string, hubAdded: string, totalHubReserve: string): boolean {
  return verify_asset_cap(assetReserve, assetCap, hubAdded, totalHubReserve);
}

function calculateLimitHubIn(
  assetReserve: string,
  assetHubReserve: string,
  assetShares: string,
  amountIn: string
): string {
  return calculate_liquidity_hub_in(assetReserve, assetHubReserve, assetShares, amountIn);
}

function isSellAllowed(bits: number): boolean {
  return is_sell_allowed(bits);
}

function isBuyAllowed(bits: number): boolean {
  return is_buy_allowed(bits);
}

function isAddLiquidityAllowed(bits: number): boolean {
  return is_add_liquidity_allowed(bits);
}

function isRemoveLiquidityAllowed(bits: number): boolean {
  return is_remove_liquidity_allowed(bits);
}

export default {
  calculateSpotPrice,
  calculateInGivenOut,
  calculateOutGivenIn,
  calculatePoolTradeFee,
  calculateShares,
  calculateLiquidityOut,
  calculateLiquidityLRNAOut,
  calculateCapDifference,
  verifyAssetCap,
  calculateLimitHubIn,
  isSellAllowed,
  isBuyAllowed,
  isAddLiquidityAllowed,
  isRemoveLiquidityAllowed,
};
