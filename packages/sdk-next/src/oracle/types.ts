import { Enum, FixedSizeArray, SizedHex } from 'polkadot-api';

import { HydrationEvents, HydrationQueries } from '@galacticcouncil/descriptors';

export type TEvmPayload = HydrationEvents['EVM']['Log'];

export type TEmaOracle = HydrationQueries['EmaOracle']['Oracles']['Value'];
export type TEmaName = SizedHex<8>;
export type TEmaPair = FixedSizeArray<2, number>;
export type TEmaPeriod = Enum<{
  LastBlock: undefined;
  Short: undefined;
  TenMinutes: undefined;
  Hour: undefined;
  Day: undefined;
  Week: undefined;
}>;

export type MmOracleEntry = {
  price: bigint;
  decimals: number;
  updatedAt: number;
};

export type MmOracleEvent = {
  eventName: string;
  /** Lowercase H160 of the contract that emitted the log. */
  emitter: string;
  /** Decoded `key` arg — present only for DIA `OracleUpdate`. */
  key?: string;
  value: bigint;
  timestamp: bigint;
};
