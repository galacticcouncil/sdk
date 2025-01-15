import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';

// Flags
export const TRADEABLE_DEFAULT = 15; // Allows all (buy/sell)

// Runtime
export const RUNTIME_DECIMALS = 18;

// System
export const SYSTEM_ASSET_ID = '0';
export const SYSTEM_ASSET_DECIMALS = 12;

// Hydration parachain
export const HYDRADX_PARACHAIN_ID = 2034;
export const HYDRADX_SS58_PREFIX = 63;
export const HYDRADX_OMNIPOOL_ADDRESS = encodeAddress(
  stringToU8a('modlomnipool'.padEnd(32, '\0')),
  HYDRADX_SS58_PREFIX
);

// Basilisk parachain
export const BASILISK_PARACHAIN_ID = 2090;
export const BASILSIK_SS58_PREFIX = 10041;

// Math
export const DENOMINATOR = 1000;
