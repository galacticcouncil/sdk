import { HydrationQueries } from '@galacticcouncil/descriptors';
import { Balance } from 'types';

export type OmnipoolGlobalFarm =
  HydrationQueries['OmnipoolWarehouseLM']['GlobalFarm']['Value'];
export type OmnipoolYieldFarm =
  HydrationQueries['OmnipoolWarehouseLM']['YieldFarm']['Value'];
export type LoyaltyCurve = OmnipoolYieldFarm['loyalty_curve'];

export type OmnipolFarm = {
  id: string;
  globalFarm: OmnipoolGlobalFarm;
  yieldFarm: OmnipoolYieldFarm;
  priceAdjustment: bigint | undefined;
  balance: Balance;
};

export type Farm = {
  apr: string;
  minApr: string | undefined;
  isDistributed: boolean;
  estimatedEndPeriod: string;
  maxRewards: bigint;
  incentivizedAsset: number;
  rewardCurrency: number;
  loyaltyCurve: LoyaltyCurve;
  currentPeriod: string;
  potMaxRewards: bigint;
  fullness: string;
  yieldFarmId: number;
  globalFarmId: number;
  poolId: string;
};
