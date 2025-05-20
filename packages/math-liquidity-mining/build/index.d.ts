/* tslint:disable */
/* eslint-disable */
export function fixed_from_rational(a: string, b: string): string;
export function calculate_loyalty_multiplier(period: string, initial_reward_percentage: string, scale_coef: string): string;
export function calculate_accumulated_rps(accumulated_rps_now: string, total_shares: string, reward: string): string;
export function calculate_user_reward(accumulated_rpvs: string, valued_shares: string, accumulated_claimed_rewards: string, accumulated_rpvs_now: string, loyalty_multiplier: string): string;
export function calculate_user_unclaimed_reward(accumulated_rpvs: string, valued_shares: string, accumulated_claimed_rewards: string, accumulated_rpvs_now: string, loyalty_multiplier: string): string;
export function calculate_valued_shares(shares: string, incentivized_asset_balance: string): string;
export function calculate_reward(accumulated_rps_start: string, accumulated_rps_now: string, shares: string): string;
export function calculate_global_farm_shares(valued_shares: string, multiplier: string): string;
export function calculate_yield_farm_rewards(yield_farm_rpz: string, global_farm_rpz: string, multiplier: string, total_valued_shares: string): string;
export function calculate_yield_farm_delta_rpvs(yield_farm_rpz: string, global_farm_rpz: string, multiplier: string, total_valued_shares: string): string;
export function calculate_global_farm_rewards(total_shares_z: string, price_adjustment: string, yield_per_period: string, max_reward_per_period: string, periods_since_last_update: string): string;
export function calculate_pool_trade_fee(a: string, fee_numerator: number, fee_denominator: number): string;
