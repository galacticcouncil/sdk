/* tslint:disable */
/* eslint-disable */
export function calculate_out_given_in(reserves: string, asset_in: number, asset_out: number, amount_in: string, amplification: string, fee: string, pegs: string): string;
export function calculate_in_given_out(reserves: string, asset_in: number, asset_out: number, amount_out: string, amplification: string, fee: string, pegs: string): string;
export function calculate_amplification(initial_amplification: string, final_amplification: string, initial_block: string, final_block: string, current_block: string): string;
export function calculate_shares(reserves: string, assets: string, amplification: string, share_issuance: string, fee: string, pegs: string): string;
export function calculate_spot_price_with_fee(pool_id: string, reserves: string, amplification: string, asset_in: string, asset_out: string, share_issuance: string, fee: string, pegs: string): string;
export function calculate_shares_for_amount(reserves: string, asset_in: number, amount: string, amplification: string, share_issuance: string, fee: string, pegs: string): string;
export function calculate_add_one_asset(reserves: string, shares: string, asset_in: number, amplification: string, share_issuance: string, fee: string, pegs: string): string;
export function pool_account_name(share_asset_id: number): Uint8Array;
export function calculate_liquidity_out_one_asset(reserves: string, shares: string, asset_out: number, amplification: string, share_issuance: string, withdraw_fee: string, pegs: string): string;
export function recalculate_peg(current_pegs: string, target_pegs: string, current_block: string, max_peg_update: string, pool_fee: string): string;
