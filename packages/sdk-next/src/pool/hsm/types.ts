import { HydrationEvents } from '@galacticcouncil/descriptors';

export type TEvmPayload = HydrationEvents['EVM']['Log'];
export type TEvmEvent = {
  eventName: string;
  facilitator: string;
  key: string;
};
