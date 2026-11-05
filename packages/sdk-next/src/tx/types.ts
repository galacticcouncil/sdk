import { PolkadotClient, Transaction as PapiTransaction } from 'polkadot-api';

import { HydrationApis } from '@galacticcouncil/descriptors';

export interface Tx {
  name?: string;
  get(): Transaction;
  dryRun(account: string): Promise<DryRunResult>;
}

export type Transaction = PapiTransaction<void | undefined>;
export type DryRunResult = HydrationApis['DryRunApi']['dry_run_call']['Value'];

export type DryRunArgs = HydrationApis['DryRunApi']['dry_run_call']['Args'];

/** Clients of the chains the vDOT mint route crosses */
export interface VdotMintChains {
  assetHub: PolkadotClient;
  bifrost: PolkadotClient;
}

/** DOT paid to each hop of the vDOT mint route */
export interface VdotMintBudgets {
  /** Delivery from Hydration to Asset Hub */
  hydration: bigint;
  /** Asset Hub execution and delivery to Bifrost */
  assetHub: bigint;
  /** Bifrost execution, including the mint */
  bifrost: bigint;
}

export interface VdotMintSupplyPlan {
  /** DOT withdrawn on Hydration */
  amount: bigint;
  /** DOT minted on Bifrost */
  mintAmount: bigint;
  /** vDOT supplied on the beneficiary's behalf */
  supplyAmount: bigint;
  /** vDOT the helper pays Hydration to run the supply */
  supplyFee: bigint;
  budgets: VdotMintBudgets;
  /** Beneficiary's account on Bifrost; Bifrost refunds land here */
  bifrostAccount: string;
  /** Hydration account that supplies on the beneficiary's behalf; keeps leftovers for later runs */
  helper: string;
}

export interface VdotMintSupplyTx extends Tx {
  plan: VdotMintSupplyPlan;
}
