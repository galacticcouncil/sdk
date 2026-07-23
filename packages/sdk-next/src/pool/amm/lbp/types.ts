import { HydrationQueries } from '@galacticcouncil/descriptors';

import { PoolFee } from '../../types';

export type TLbpPoolData = HydrationQueries['LBP']['PoolData']['Value'];

export interface LbpSnapshot {
  repayFee: PoolFee;
}
