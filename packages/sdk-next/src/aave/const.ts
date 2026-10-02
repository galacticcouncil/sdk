import { AaveMarket } from './types';

export const AAVE_POOL_PROXY = '0x1b02E051683b5cfaC5929C25E84adb26ECf87B38';
export const AAVE_POOL_DATA_PROVIDER =
  '0x112b087b60C1a166130d59266363C45F8aa99db0';

export const AAVE_LENDING_POOL_ADDRESS =
  '0xf3Ba4D1b50f78301BDD7EAEa9B67822A15FCA691';

/**
 * Aave v3 markets.
 *
 * - aTokens are listed from each market's reserves, so a new reserve needs
 *   no config
 * - Only `tradeable` markets count when a trade decides on extra gas
 */
export const AAVE_MARKETS: readonly AaveMarket[] = [
  // main
  {
    pool: AAVE_POOL_PROXY,
    provider: AAVE_LENDING_POOL_ADDRESS,
    tradeable: true,
  },
  // BIL
  {
    pool: '0x69310FdA58c819aD82df7d2Cb61841C853337a53',
    provider: '0x653DFc382b74E7399dae06DC4d07202E28b5990B',
    tradeable: true,
  },
  // GIGAHDX: its aToken never trades
  {
    pool: '0x2Ce2CfFF743CdB6637F4B5D351937A541B8c8923',
    provider: '0x3C7D7b74bB625736b93d859e332F06Df64635973',
    tradeable: false,
  },
];

export const AAVE_GAS_LIMIT = 1_000_000n;
export const AAVE_ROUNDING_THRESHOLD = 5;
export const AAVE_UINT_256_MAX = BigInt(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
);
