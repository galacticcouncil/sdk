import { Enum, FixedSizeArray, SizedHex } from 'polkadot-api';

import {
  HydrationEvents,
  HydrationQueries,
} from '@galacticcouncil/descriptors';

import { PoolFee } from '../../types';

export type TStableswap = HydrationQueries['Stableswap']['Pools']['Value'];
export type TStableswapPeg =
  HydrationQueries['Stableswap']['PoolPegs']['Value'];

export type TEmaOracle = HydrationQueries['EmaOracle']['Oracles']['Value'];

export type TEmaName = SizedHex<8>;
export type TEmaPair = FixedSizeArray<2, number>;
export type TEmaPeriod = Enum<{
  LastBlock: undefined;
  Short: undefined;
  TenMinutes: undefined;
  Hour: undefined;
  Day: undefined;
  Week: undefined;
}>;

export type TPegLatest = { pair: string[]; updatedAt: string; source?: string };
export type TPeg = { pegsFee: PoolFee; pegs: string[][] };
export type TEvmPayload = HydrationEvents['EVM']['Log'];
