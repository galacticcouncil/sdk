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

/** An aToken the asset registry knows, with the market it belongs to */
export type AaveAToken = {
  aTokenId: number;
  aToken: H160;
  underlying: H160;
  underlyingId: number | null;
  market: AaveMarket;
};

/** One reserve of a market summary, seen from a user */
export type AaveMarketReserve = {
  aToken: H160;
  aTokenId: number | null;
  underlying: H160;
  underlyingId: number | null;
  aTokenBalance: bigint;
  availableLiquidity: bigint;
  decimals: number;
  priceInRef: bigint;
  /** Liquidation threshold as a fraction, e-mode aware */
  liquidationThreshold: number;
  /** Counts toward the user's collateral now: flagged, held, threshold > 0 */
  isCollateral: boolean;
  /** Counts toward the user's collateral once the user receives more of it */
  isCollateralOnSupply: boolean;
};

/** A user's position in one market */
export type AaveMarketSummary = {
  market: AaveMarket;
  /** On-chain health factor, `-1` without debt */
  healthFactor: number;
  currentLiquidationThreshold: number;
  totalCollateral: bigint;
  totalDebt: bigint;
  reserves: AaveMarketReserve[];
};

/** Health factor now and after an action; `-1` when the user has no debt */
export type AaveHealthFactorPreview = {
  current: number;
  projected: number;
};
