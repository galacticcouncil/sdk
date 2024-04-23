import { AnyChain } from '@galacticcouncil/xcm-core';
import { ApiPromise } from '@polkadot/api';
import { isH160Address } from '../utils';

import { EvmResolver } from './types';

export class EvmReconciler {
  readonly chain: AnyChain;
  readonly evmResolver: EvmResolver;

  constructor(chain: AnyChain, evmResolver: EvmResolver) {
    this.chain = chain;
    this.evmResolver = evmResolver;
  }

  toEvmAddress(address: string, api?: ApiPromise) {
    if (isH160Address(address)) {
      return address;
    }

    try {
      return this.evmResolver.toH160(address, api);
    } catch {
      throw new Error(`No EVM resolver found for ` + this.chain.name);
    }
  }
}
