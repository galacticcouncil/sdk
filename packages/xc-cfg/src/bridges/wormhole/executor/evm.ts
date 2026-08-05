import { ExecutorBudgetBuilder } from './types';

// Upstream DEFAULT_EXECUTOR_GAS_LIMIT (evm/ts/src/executorGasLimits.ts).
const GAS_LIMIT = 500_000n;

/** An evm redeem holds nothing - receiveMessage moves no value. */
export const EvmExecutorBudget = (): ExecutorBudgetBuilder => ({
  build: async () => ({
    gasLimit: GAS_LIMIT,
    msgValue: 0n,
  }),
});
