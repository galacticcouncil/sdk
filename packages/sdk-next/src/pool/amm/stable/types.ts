import {
  HydrationEvents,
  HydrationQueries,
} from '@galacticcouncil/descriptors';

import { PoolFee } from '../../types';

export type TStableswap = HydrationQueries['Stableswap']['Pools']['Value'];
export type TStableswapPeg =
  HydrationQueries['Stableswap']['PoolPegs']['Value'];

export type TPegLatest = { pair: string[]; updatedAt: string; source?: string };
export type TPeg = { pegsFee: PoolFee; pegs: string[][] };
export type TEvmPayload = HydrationEvents['EVM']['Log'];
