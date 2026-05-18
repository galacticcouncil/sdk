import { HydrationEvents } from '@galacticcouncil/descriptors';

export type TEvmPayload = HydrationEvents['EVM']['Log'];

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
