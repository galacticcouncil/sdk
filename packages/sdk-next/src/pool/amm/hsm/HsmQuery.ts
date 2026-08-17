import { GhoTokenClient } from '../../../gho';

import { PoolQuery } from '../../PoolQuery';

/**
 * HSM reads.
 *
 * - Collateral sits at the HSM facilitator account, not at a pool address
 * - Mint capacity is the facilitator's remaining GHO bucket, read over EVM
 */
export class HsmQuery extends PoolQuery {
  private gho = new GhoTokenClient(this.evm);

  /** Every collateral's HSM config */
  readonly collaterals = this.cache.scope(
    'HSM.Collaterals.entries',
    (at) => this.api.query.HSM.Collaterals.getEntries({ at }),
    () => 'entries',
    'block'
  );

  /** Facilitator's remaining mint capacity (bucket capacity less level) */
  readonly mintCapacity = this.cache.scope<[string, string], bigint>(
    'HSM.MintCapacity',
    (_at, hollar, facilitator) =>
      this.gho.getFacilitatorCapacity(hollar, facilitator),
    (hollar, facilitator) => `${hollar}:${facilitator}`,
    'block'
  );

  hollarId(): Promise<number> {
    return this.api.constants.HSM.HollarId();
  }
}
