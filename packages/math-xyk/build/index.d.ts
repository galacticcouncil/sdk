/* tslint:disable */
/* eslint-disable */
export function get_spot_price(s: string, b: string, a: string): string;
export function calculate_spot_price(s: string, b: string): string;
export function calculate_spot_price_with_fee(s: string, b: string, fee_rate_n: string, fee_rate_d: string): string;
export function calculate_out_given_in(s: string, b: string, a: string): string;
export function calculate_in_given_out(s: string, b: string, a: string): string;
export function calculate_liquidity_in(reserve_a: string, reserve_b: string, amount_a: string): string;
export function calculate_shares(reserve_a: string, amount_a: string, total_shares: string): string;
export function calculate_liquidity_out_asset_a(reserve_a: string, reserve_b: string, shares: string, total_shares: string): string;
export function calculate_liquidity_out_asset_b(reserve_a: string, reserve_b: string, shares: string, total_shares: string): string;
export function calculate_pool_trade_fee(a: string, fee_numerator: number, fee_denominator: number): string;
