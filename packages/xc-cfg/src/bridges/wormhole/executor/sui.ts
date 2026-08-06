import { ExecutorBudgetBuilder } from './types';

// Sui budgets in MIST - a real gas budget, not an abstract unit, which is why
// this is 20x the evm number rather than comparable to it.
//
// Measured against the sui ntt manager this route targets: live redeems
// (parse_and_verify -> validate_message -> redeem -> release) settled at
// ~6.48M MIST net against a 7_556_176 budget. 10M clears the observed budget
// with ~32% headroom and sits far under sui's 1e9 maxGasLimit. Upstream pads
// the same estimate to 20M.
const GAS_LIMIT = 10_000_000n;

/** A sui redeem holds nothing - the coin is minted to the recipient. */
export const SuiExecutorBudget = (): ExecutorBudgetBuilder => ({
  build: async () => ({
    gasLimit: GAS_LIMIT,
    msgValue: 0n,
  }),
});
