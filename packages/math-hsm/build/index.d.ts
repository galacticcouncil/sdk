/* tslint:disable */
/* eslint-disable */
export function calculate_hollar_out_given_collateral_in(amount_in: string, collateral_peg: string, purchase_fee: string): string;
export function calculate_collateral_in_given_hollar_out(amount_out: string, collateral_peg: string, purchase_fee: string): string;
export function calculate_collateral_out_given_hollar_in(amount_in: string, amount_out: string, buyback_fee: string): string;
export function calculate_hollar_in_given_collateral_out(amount_out: string, amount_in: string, buyback_fee: string): string;
export function calculate_imbalance(hollar_reserve: string, collateral_peg: string, collateral_reserve: string): string;
export function calculate_buyback_limit(imbalance: string, b: string): string;
export function calculate_buyback_price_with_fee(execution_price_n: string, execution_price_d: string, buyback_fee: string): string;
export function calculate_max_price(collateral_peg: string, coefficient: string): string;
