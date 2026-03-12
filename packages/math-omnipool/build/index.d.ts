/* tslint:disable */
/* eslint-disable */
export function calculate_shares(asset_reserve: string, asset_hub_reserve: string, asset_shares: string, amount_in: string): string;
export function calculate_withdrawal_fee(spot_price: string, oracle_price: string, min_withdrawal_fee: string): string;
export function calculate_liquidity_out(asset_reserve: string, asset_hub_reserve: string, asset_shares: string, position_amount: string, position_shares: string, position_price: string, shares_to_remove: string, withdrawal_fee: string): string;
export function calculate_liquidity_lrna_out(asset_reserve: string, asset_hub_reserve: string, asset_shares: string, position_amount: string, position_shares: string, position_price: string, shares_to_remove: string, withdrawal_fee: string): string;
export function recalculate_asset_fee(oracle_amount_in: string, oracle_amount_out: string, oracle_liquidity: string, oracle_period: string, current_asset_liquidity: string, previous_fee: string, block_difference: string, min_fee: string, max_fee: string, decay: string, amplification: string): string;
export function recalculate_protocol_fee(oracle_amount_in: string, oracle_amount_out: string, oracle_liquidity: string, oracle_period: string, current_asset_liquidity: string, previous_fee: string, block_difference: string, min_fee: string, max_fee: string, decay: string, amplification: string): string;
export function calculate_out_given_in(asset_in_reserve: string, asset_in_hub_reserve: string, asset_in_shares: string, asset_out_reserve: string, asset_out_hub_reserve: string, asset_out_shares: string, amount_in: string, asset_fee: string, protocol_fee: string, max_slip_fee: string): string;
export function calculate_out_given_lrna_in(asset_reserve: string, asset_hub_reserve: string, asset_shares: string, amount_in: string, asset_fee: string, max_slip_fee: string): string;
export function calculate_in_given_out(asset_in_reserve: string, asset_in_hub_reserve: string, asset_in_shares: string, asset_out_reserve: string, asset_out_hub_reserve: string, asset_out_shares: string, amount_out: string, asset_fee: string, protocol_fee: string, max_slip_fee: string): string;
export function calculate_lrna_in_given_out(asset_reserve: string, asset_hub_reserve: string, asset_shares: string, amount_out: string, asset_fee: string, max_slip_fee: string): string;
export function calculate_spot_price(asset_a_reserve: string, asset_a_hub_reserve: string, asset_b_reserve: string, asset_b_hub_reserve: string): string;
export function calculate_spot_price_with_fee(asset_a_reserve: string, asset_a_hub_reserve: string, asset_b_reserve: string, asset_b_hub_reserve: string, protocol_fee: string, asset_fee: string): string;
export function calculate_lrna_spot_price(asset_reserve: string, asset_hub_reserve: string): string;
export function calculate_lrna_spot_price_with_fee(asset_reserve: string, asset_hub_reserve: string, asset_fee: string): string;
export function calculate_cap_difference(asset_reserve: string, asset_hub_reserve: string, asset_cap: string, total_hub_reserve: string): string;
export function verify_asset_cap(asset_hub_reserve: string, asset_cap: string, hub_added: string, total_hub_reserve: string): boolean;
export function calculate_tvl_cap_difference(asset_reserve: string, asset_hub_reserve: string, stable_asset_reserve: string, stable_asset_hub_reserve: string, tvl_cap: string, total_hub_reserve: string): string;
export function calculate_liquidity_hub_in(asset_reserve: string, asset_hub_reserve: string, asset_shares: string, amount_in: string): string;
export function is_sell_allowed(bits: number): boolean;
export function is_buy_allowed(bits: number): boolean;
export function is_add_liquidity_allowed(bits: number): boolean;
export function is_remove_liquidity_allowed(bits: number): boolean;
