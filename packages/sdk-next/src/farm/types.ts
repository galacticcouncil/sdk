import { HydrationQueries } from '@galacticcouncil/descriptors';

import { Balance } from '../types';

export type IsolatedGlobalFarm =
  HydrationQueries['XYKWarehouseLM']['GlobalFarm']['Value'];

export type ISolatedYieldFarm =
  HydrationQueries['XYKWarehouseLM']['YieldFarm']['Value'];

export type OmnipoolGlobalFarm =
  HydrationQueries['OmnipoolWarehouseLM']['GlobalFarm']['Value'];

export type OmnipoolYieldFarm =
  HydrationQueries['OmnipoolWarehouseLM']['YieldFarm']['Value'];

export type OmnipoolWarehouseLMDeposit =
  HydrationQueries['OmnipoolWarehouseLM']['Deposit']['Value'];

export type YieldFarmEntry =
  | OmnipoolWarehouseLMDeposit['yield_farm_entries'][number]
  | HydrationQueries['XYKWarehouseLM']['Deposit']['Value']['yield_farm_entries'][number];

export type OmnipoolFarm = {
  id: string;
  globalFarm: OmnipoolGlobalFarm;
  yieldFarm: OmnipoolYieldFarm;
  priceAdjustment: bigint | undefined;
  balance: Balance;
};

export type GlobalFarm = OmnipoolGlobalFarm | IsolatedGlobalFarm;
export type YieldFarm = OmnipoolYieldFarm | ISolatedYieldFarm;

export type LoyaltyCurve = OmnipoolYieldFarm['loyalty_curve'];

export type FarmDepositReward = {
  readonly reward: bigint;
  readonly maxReward: bigint;
  readonly assetId: number;
  readonly yieldFarmId: number;
  readonly isActiveFarm: boolean;
};

export type Farm = {
  apr: string;
  minApr: string | undefined;
  isDistributed: boolean;
  estimatedEndPeriod: string;
  estimatedEndBlock: string;
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
  distributedRewards: bigint;
  plannedYieldingPeriods: number;
  minDeposit: bigint;
};
