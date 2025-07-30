/* tslint:disable */
/* eslint-disable */
export function get_spot_price(s: string, b: string, s_w: string, b_w: string, a: string): string;
export function calculate_spot_price(s: string, b: string, s_w: string, b_w: string): string;
export function calculate_spot_price_with_fee(s: string, b: string, s_w: string, b_w: string, fee_asset: string, asset_out: string, fee_rate_n: string, fee_rate_d: string): string;
export function calculate_out_given_in(s: string, b: string, s_w: string, b_w: string, a: string): string;
export function calculate_in_given_out(s: string, b: string, s_w: string, b_w: string, a: string): string;
export function calculate_linear_weights(start_x: string, end_x: string, start_y: string, end_y: string, at: string): string;
export function calculate_pool_trade_fee(a: string, fee_numerator: number, fee_denominator: number): string;
