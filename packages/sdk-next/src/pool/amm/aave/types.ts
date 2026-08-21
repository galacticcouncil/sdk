import { HydrationApis, HydrationEvents } from '@galacticcouncil/descriptors';

export type TAavePool = HydrationApis['AaveTradeExecutor']['pool']['Value'];
export type TAavePools = HydrationApis['AaveTradeExecutor']['pools']['Value'];

export type TRouterExecutedPayload = HydrationEvents['Router']['Executed'];
export type TRouterEvent = {
  assetIn: number;
  assetOut: number;
  key: string;
};
