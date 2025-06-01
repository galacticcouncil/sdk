import { bnum } from '../utils/bignumber';

export const DEFAULT_BLOCK_TIME = 6000;
export const DEFAULT_MIN_BUDGET = bnum(1000000000000000);

export const TWAP_BLOCK_PERIOD = 6;
export const TWAP_MAX_PRICE_IMPACT = -5;
export const TWAP_MAX_DURATION = 6 * 60 * 60 * 1000;
export const TWAP_TX_MULTIPLIER = 3;

export const ORDER_MIN_BLOCK_PERIOD = 6;
