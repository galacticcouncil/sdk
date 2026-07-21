import { HydrationEvents } from '@galacticcouncil/descriptors';

export type TRouterExecutedPayload = HydrationEvents['Router']['Executed'];
export type TRouterEvent = {
  assetIn: number;
  assetOut: number;
  key: string;
};
