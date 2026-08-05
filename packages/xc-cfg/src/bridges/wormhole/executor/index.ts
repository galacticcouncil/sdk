import { EvmExecutorBudget } from './evm';
import { SolanaExecutorBudget } from './solana';
import { SuiExecutorBudget } from './sui';
import { ExecutorBudget, ExecutorBudgetParams } from './types';

export * from './types';

/**
 * Executor budget for a destination.
 *
 * Keyed on the destination, not the source: hydration -> sui is an evm source
 * with a sui destination, and it is sui's budget that has to be met.
 *
 * The single place either budget is decided. A signed quote is only honoured
 * for the instructions it was priced against, so the fee builder and the
 * transfer builder have to derive them the same way or the amount paid and
 * the amount requested disagree.
 */
export const executorBudget = (
  params: ExecutorBudgetParams
): Promise<ExecutorBudget> => {
  const { destination } = params;

  if (destination.isSolana()) {
    return SolanaExecutorBudget().build(params);
  }
  if (destination.isSui()) {
    return SuiExecutorBudget().build(params);
  }
  return EvmExecutorBudget().build(params);
};

export { EvmExecutorBudget, SolanaExecutorBudget, SuiExecutorBudget };
