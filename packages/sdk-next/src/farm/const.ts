import Big from 'big.js';

export const BN_QUINTILL = Big(10).pow(18);

export const DEFAULT_ORACLE_PRICE = BigInt(Big(1).pow(18).toString());
export const DEFAULT_BLOCK_TIME = 6000;
