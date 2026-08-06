import { AnyChain, Asset } from '@galacticcouncil/xc-core';

/**
 * What the Executor is asked to reserve to redeem on a destination.
 *
 * `gasLimit` budgets execution, `msgValue` budgets what the executor must
 * hold. Both are destination units - evm gas, svm compute units, sui MIST -
 * so neither has a value that is meaningful across chains.
 */
export type ExecutorBudget = {
  gasLimit: bigint;
  msgValue: bigint;
};

export type ExecutorBudgetParams = {
  destination: AnyChain;
  /** Destination asset, resolving the spl mint on an svm destination. */
  asset?: Asset;
  /** Recipient on the destination, whose accounts the redeem may open. */
  recipient?: string;
};

export interface ExecutorBudgetBuilder {
  build: (params: ExecutorBudgetParams) => Promise<ExecutorBudget>;
}
