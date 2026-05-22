import { HydrationEvents } from '@galacticcouncil/descriptors';

export type TEvmPayload = HydrationEvents['EVM']['Log'];

export type GhoTokenEvent = {
  eventName: string;
  facilitator: string;
  key: string;
};
