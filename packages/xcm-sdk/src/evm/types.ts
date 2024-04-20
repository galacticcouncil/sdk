import type { ApiPromise } from '@polkadot/api';

import { Chain } from 'viem';

export interface EvmResolver {
  toH160(ss58Addr: string, api?: ApiPromise): Promise<string>;
}

export interface EvmResolvers {
  [key: string]: EvmResolver;
}

export interface EvmChains {
  [key: string]: Chain;
}
