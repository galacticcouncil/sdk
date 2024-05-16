/* tslint:disable */
/* eslint-disable */
/**
* @param {string} a
* @param {number} fee_numerator
* @param {number} fee_denominator
* @returns {string}
*/
export function calculate_pool_trade_fee(a: string, fee_numerator: number, fee_denominator: number): string;
/**
* @param {string} s
* @param {string} b
* @param {string} s_w
* @param {string} b_w
* @param {string} a
* @returns {string}
*/
export function get_spot_price(s: string, b: string, s_w: string, b_w: string, a: string): string;
/**
* @param {string} s
* @param {string} b
* @param {string} s_w
* @param {string} b_w
* @param {string} a
* @returns {string}
*/
export function calculate_out_given_in(s: string, b: string, s_w: string, b_w: string, a: string): string;
/**
* @param {string} s
* @param {string} b
* @param {string} s_w
* @param {string} b_w
* @param {string} a
* @returns {string}
*/
export function calculate_in_given_out(s: string, b: string, s_w: string, b_w: string, a: string): string;
/**
* @param {string} start_x
* @param {string} end_x
* @param {string} start_y
* @param {string} end_y
* @param {string} at
* @returns {string}
*/
export function calculate_linear_weights(start_x: string, end_x: string, start_y: string, end_y: string, at: string): string;
