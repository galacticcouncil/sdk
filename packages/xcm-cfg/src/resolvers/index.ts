import { EvmResolver } from '@galacticcouncil/xcm-core';

import { AcalaEvmResolver } from './acala';
import { HydrationEvmResolver } from './hydration';

export const evmResolvers: Record<string, EvmResolver> = {
  acala: new AcalaEvmResolver(),
  hydration: new HydrationEvmResolver(),
};
