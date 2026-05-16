import { HydrationEvents } from '@galacticcouncil/descriptors';

export type TEvmPayload = HydrationEvents['EVM']['Log'];

export type MmOracleEntry = {
  price: bigint;
  decimals: number;
  updatedAt: number;
};

export type MmOracleEvent = {
  eventName: string;
  value: bigint;
  timestamp: bigint;
};
