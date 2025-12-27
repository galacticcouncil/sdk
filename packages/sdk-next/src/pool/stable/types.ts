import { Enum, FixedSizeArray, FixedSizeBinary } from 'polkadot-api';

import { HydrationQueries } from '@galacticcouncil/descriptors';

export type TStableswap = HydrationQueries['Stableswap']['Pools']['Value'];
export type TStableswapPeg =
  HydrationQueries['Stableswap']['PoolPegs']['Value'];

export type TEmaOracle = HydrationQueries['EmaOracle']['Oracles']['Value'];

export type TEmaName = FixedSizeBinary<8>;
export type TEmaPair = FixedSizeArray<2, number>;
export type TEmaPeriod = Enum<{
  LastBlock: undefined;
  Short: undefined;
  TenMinutes: undefined;
  Hour: undefined;
  Day: undefined;
  Week: undefined;
}>;
