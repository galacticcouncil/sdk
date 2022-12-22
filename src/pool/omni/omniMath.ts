import {
  calculate_in_given_out,
  calculate_out_given_in,
  calculate_pool_trade_fee,
  calculate_spot_price,
} from '@galacticcouncil/math-omnipool';

export function calculateSpotPrice(
  assetInBalance: string,
  assetInHubReserve: string,
  assetOutBalance: string,
  assetOutHubReserve: string
): string {
  return calculate_spot_price(assetInBalance, assetInHubReserve, assetOutBalance, assetOutHubReserve);
}

export function calculateInGivenOut(
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

export function calculateOutGivenIn(
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

export function calculatePoolTradeFee(a: string, fee_numerator: number, fee_denominator: number): string {
  return calculate_pool_trade_fee(a, fee_numerator, fee_denominator);
}

export default {
  calculateSpotPrice,
  calculateInGivenOut,
  calculateOutGivenIn,
  calculatePoolTradeFee,
};
