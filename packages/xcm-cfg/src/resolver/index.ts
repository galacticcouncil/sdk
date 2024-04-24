import { EvmResolver } from '@galacticcouncil/xcm-core';

import { AcalaEvmResolver } from './acala';
import { HydraDxEvmResolver } from './hydradx';

export const evmResolvers: Record<string, EvmResolver> = {
  acala: new AcalaEvmResolver(),
  hydradx: new HydraDxEvmResolver(),
};
