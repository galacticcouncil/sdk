import { AcalaEvmResolver } from './acala';
import { HydraDxEvmResolver } from './hydradx';

import { EvmResolver } from '../types';

export const evmResolvers: Record<string, EvmResolver> = {
  acala: new AcalaEvmResolver(),
  hydradx: new HydraDxEvmResolver(),
};
