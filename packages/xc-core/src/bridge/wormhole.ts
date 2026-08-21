import {
  PlatformAddressFormat,
  UniversalAddress,
} from '@wormhole-foundation/sdk-connect';

import type { NttDef } from './ntt';

import { AnyChain } from '../chain';

export type WormholeDef = {
  id: number;
  coreBridge: string;
  executor?: string;
  nttExecutor?: string;
  ntt?: NttDef;
  platformAddressFormat?: PlatformAddressFormat;
};

export class Wormhole {
  readonly id: number;
  readonly coreBridge: string;
  readonly executor?: string;
  readonly nttExecutor?: string;
  readonly ntt: NttDef;
  readonly platformAddressFormat?: PlatformAddressFormat;

  constructor({
    id,
    coreBridge,
    executor,
    nttExecutor,
    ntt,
    platformAddressFormat,
  }: WormholeDef) {
    this.id = id;
    this.coreBridge = coreBridge;
    this.executor = executor;
    this.nttExecutor = nttExecutor;
    this.ntt = ntt ?? {};
    this.platformAddressFormat = platformAddressFormat;
  }

  static fromChain(chain: AnyChain): Wormhole {
    if ('wormhole' in chain && !!chain['wormhole']) {
      return chain.wormhole as Wormhole;
    }
    throw new Error(chain.name + ' is not supported in Wormhole.');
  }

  static isKnown(chain: AnyChain): boolean {
    return 'wormhole' in chain && !!chain['wormhole'];
  }

  getWormholeId(): number {
    return this.id;
  }

  getCoreBridge(): string {
    return this.coreBridge;
  }

  getExecutor(): string {
    if (this.executor) {
      return this.executor;
    }
    throw new Error('Wormhole executor configuration missing');
  }

  /**
   * NttManagerWithExecutor - the wrapper a sender calls to have the Executor
   * service deliver the transfer. Distinct from {@link executor}, which is the
   * Executor contract the relayer watches; conflating the two builds a call to
   * an address with no `transfer` on it.
   */
  getNttExecutor(): string {
    if (this.nttExecutor) {
      return this.nttExecutor;
    }
    throw new Error('Wormhole ntt executor configuration missing');
  }

  /**
   * Format chain native address to Wormhole address
   *
   * @param address - chain native address
   * @returns 32-byte universal multichain hex address representation
   */
  normalizeAddress(address: string): string {
    return new UniversalAddress(address, this.platformAddressFormat).toString();
  }
}
