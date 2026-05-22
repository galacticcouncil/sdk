import { HydrationEvents } from '@galacticcouncil/descriptors';

export type TEvmPayload = HydrationEvents['EVM']['Log'];

export type AaveEvent = {
  eventName: string;
  reserve: string;
  key: string;
};

export type AaveSummary = {
  healthFactor: number;
  currentLiquidationThreshold: number;
  totalCollateral: bigint;
  totalDebt: bigint;
  reserves: AaveReserveData[];
};

export type AaveReserveData = {
  aTokenBalance: bigint;
  availableLiquidity: bigint;
  decimals: number;
  isCollateral: boolean;
  priceInRef: bigint;
  reserveId: number | null;
  reserveAsset: string;
  reserveLiquidationThreshold: number;
};
