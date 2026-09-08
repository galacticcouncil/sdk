import { AccountId } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { HYDRATION_SS58_PREFIX } from '@galacticcouncil/common';

export function getAccountAddress(seed: string) {
  const name = ('modl' + seed).padEnd(32, '\0');
  const nameU8a = new TextEncoder().encode(name);
  const nameHex = toHex(nameU8a);
  return AccountId(HYDRATION_SS58_PREFIX).dec(nameHex);
}

/**
 * Staking period number for a block, exact TypeScript port of
 * `hydra-dx-math::staking::calculate_period_number` (2s runtime, 4-arg).
 *
 * `PeriodLength` is 12s-denominated (7200 = 1 day). The pallet keeps
 * "1 period = 1 wall-clock day" across block-time migrations by weighting
 * blocks per era against two switch anchors:
 *
 * - `sixSecBlocksSince` — 12s→6s switch (`Staking.SixSecBlocksSince`)
 * - `twoSecBlocksSince` — 6s→2s switch (`Parameters.TwoSecBlocksSince`,
 *   `u32::MAX` sentinel until the runtime migration sets it)
 *
 * The published `math-staking` wasm still exposes only the 3-arg version;
 * counting 2s blocks with it inflates period accrual 3× after the switch.
 * Integer (floor) division throughout, matching the runtime.
 */
export function calculatePeriodNumber(
  periodLength: bigint,
  blockNumber: bigint,
  sixSecBlocksSince: bigint,
  twoSecBlocksSince: bigint
): bigint {
  if (blockNumber <= sixSecBlocksSince) {
    return blockNumber / periodLength;
  }

  if (
    blockNumber <= twoSecBlocksSince ||
    twoSecBlocksSince <= sixSecBlocksSince
  ) {
    return (sixSecBlocksSince + blockNumber) / (periodLength * 2n);
  }

  const normalized =
    sixSecBlocksSince * 6n +
    (twoSecBlocksSince - sixSecBlocksSince) * 3n +
    (blockNumber - twoSecBlocksSince);

  return normalized / (periodLength * 6n);
}
