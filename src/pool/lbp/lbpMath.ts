import {
  calculate_in_given_out,
  calculate_out_given_in,
  calculate_linear_weights,
  calculate_pool_trade_fee,
  get_spot_price,
} from '@galacticcouncil/math-lbp';

function getSpotPrice(s: string, b: string, s_w: string, b_w: string, a: string): string {
  return get_spot_price(s, b, s_w, b_w, a);
}

function calculateInGivenOut(s: string, b: string, s_w: string, b_w: string, a: string): string {
  return calculate_in_given_out(s, b, s_w, b_w, a);
}

function calculateOutGivenIn(s: string, b: string, s_w: string, b_w: string, a: string): string {
  return calculate_out_given_in(s, b, s_w, b_w, a);
}

function calculateLinearWeights(start_x: string, end_x: string, start_y: string, end_y: string, at: string): string {
  return calculate_linear_weights(start_x, end_x, start_y, end_y, at);
}

function calculatePoolTradeFee(a: string, fee_numerator: number, fee_denominator: number): string {
  return calculate_pool_trade_fee(a, fee_numerator, fee_denominator);
}

export default {
  getSpotPrice,
  calculateInGivenOut,
  calculateOutGivenIn,
  calculateLinearWeights,
  calculatePoolTradeFee,
};
