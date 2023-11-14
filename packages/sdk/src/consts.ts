import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';

export const RUNTIME_DECIMALS = 18;
export const TRADEABLE_DEFAULT = 15; // Allows all (buy/sell)

export const SYSTEM_ASSET_ID = '0';
export const SYSTEM_ASSET_DECIMALS = 12;

export const HYDRADX_PARACHAIN_ID = 2034;
export const HYDRADX_SS58_PREFIX = 63;

export const BASILISK_PARACHAIN_ID = 2090;

export const DENOMINATOR = 1000;

export const HYDRADX_OMNIPOOL_ADDRESS = encodeAddress(
  stringToU8a('modlomnipool'.padEnd(32, '\0')),
  HYDRADX_SS58_PREFIX
);
