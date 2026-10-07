import { HydrationEvents } from '@galacticcouncil/descriptors';

import { H160 } from '../evm';

export type TEvmPayload = HydrationEvents['EVM']['Log'];

export type AaveEvent = {
  eventName: string;
  reserve: string;
  key: string;
};

/** One Aave v3 market: its pool and the addresses provider describing it */
export type AaveMarket = {
  pool: H160;
  provider: H160;
  /** Its aTokens can be sold through the router */
  tradeable: boolean;
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
  /** Counts toward the user's collateral now: flagged, held, threshold > 0 */
  isCollateral: boolean;
  priceInRef: bigint;
  reserveId: number | null;
  reserveAsset: string;
  /** Liquidation threshold as a fraction, e-mode aware */
  reserveLiquidationThreshold: number;
  /** aToken contract */
  aToken: H160;
  /** Counts toward the user's collateral once the user receives more of it */
  isCollateralOnSupply: boolean;
};
