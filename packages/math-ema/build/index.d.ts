/* tslint:disable */
/* eslint-disable */
export function calculate_pool_trade_fee(a: string, fee_numerator: number, fee_denominator: number): string;
/**
 * Calculate the iterated exponential moving average for the given prices.
 * + `iterations` is the number of iterations of the EMA to calculate (expected to be a serialized `u32`).
 * + `prev_n` and `prev_d` are the previous oracle value, `incoming_n` and `incoming_d` are the new value to
 *   integrate (expected to be serialized `u128` values).
 * + `smoothing` is the smoothing factor of the EMA (expected to be a serialized `u128` that gets interpreted as a
 *   `Fraction`).
 *
 * Returns the new oracle value as a serialized `FixedU128` (lower precision than the input).
 */
export function low_precision_iterated_price_ema(iterations: string, prev_n: string, prev_d: string, incoming_n: string, incoming_d: string, smoothing: string): string;
/**
 * Calculate the iterated exponential moving average for the given balances.
 * + `iterations` is the number of iterations of the EMA to calculate (expected to be a serialized `u32`).
 * + `prev` is the previous oracle value, `incoming` is the new value to integrate (expected to be serialized
 *   `u128` values).
 * + `smoothing` is the smoothing factor of the EMA (expected to be a serialized `u128` that gets interpreted as a
 *   `Fraction`).
 *
 * Returns the new oracle value as a serialized `u128`.
 */
export function iterated_balance_ema(iterations: string, prev: string, incoming: string, smoothing: string): string;
