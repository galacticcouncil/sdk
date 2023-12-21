import type { ApiPromise } from '@polkadot/api';

export type EvmResolver = (api: ApiPromise, address: string) => Promise<string>;
