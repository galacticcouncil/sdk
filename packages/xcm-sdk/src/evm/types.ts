import type { ApiPromise } from '@polkadot/api';

export interface EvmResolver {
  toH160(ss58Addr: string, api?: ApiPromise): Promise<string>;
}
