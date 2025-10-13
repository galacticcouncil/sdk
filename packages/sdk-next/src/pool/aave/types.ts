import { HydrationEvents } from '@galacticcouncil/descriptors';

export type TEvmPayload = HydrationEvents['EVM']['Log'];
export type TEvmEvent = {
  eventName: string;
  reserve: string;
  key: string;
};

export type TRouterExecutedPayload = HydrationEvents['Router']['Executed'];
export type TRouterEvent = {
  assetIn: number;
  assetOut: number;
  key: string;
};
