import { HydrationQueries } from '@galacticcouncil/descriptors';

import { Balance } from '../types';

export type FarmDepositReward = {
  readonly reward: bigint;
  readonly maxReward: bigint;
  readonly assetId: number;
};

export type OmnipoolGlobalFarm =
  HydrationQueries['OmnipoolWarehouseLM']['GlobalFarm']['Value'];

export type OmnipoolYieldFarm =
  HydrationQueries['OmnipoolWarehouseLM']['YieldFarm']['Value'];

export type IsolatedGlobalFarm =
  HydrationQueries['XYKWarehouseLM']['GlobalFarm']['Value'];

export type ISolatedYieldFarm =
  HydrationQueries['XYKWarehouseLM']['YieldFarm']['Value'];

export type OmnipoolWarehouseLMDeposit =
  HydrationQueries['OmnipoolWarehouseLM']['Deposit']['Value'];

export type OmnipoolWarehouseLMDepositYieldFarmEntry =
  OmnipoolWarehouseLMDeposit['yield_farm_entries'][number];

export type OmnipoolFarm = {
  id: string;
  globalFarm: OmnipoolGlobalFarm;
  yieldFarm: OmnipoolYieldFarm;
  priceAdjustment: bigint | undefined;
  balance: Balance;
};

export type GlobalFarm = OmnipoolGlobalFarm | IsolatedGlobalFarm;
export type YieldFarm = OmnipoolYieldFarm | ISolatedYieldFarm;
