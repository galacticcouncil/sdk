import {
  PlatformAddressFormat,
  UniversalAddress,
} from '@wormhole-foundation/sdk-connect';

import { AnyChain } from '../chain';

export type WormholeDef = {
  id: number;
  coreBridge: string;
  tokenBridge: string;
  tokenRelayer?: string;
  platformAddressFormat?: PlatformAddressFormat;
};

export class Wormhole {
  readonly id: number;
  readonly coreBridge: string;
  readonly tokenBridge: string;
  readonly tokenRelayer?: string;
  readonly platformAddressFormat?: PlatformAddressFormat;

  constructor({
    id,
    coreBridge,
    tokenBridge,
    tokenRelayer,
    platformAddressFormat,
  }: WormholeDef) {
    this.id = id;
    this.coreBridge = coreBridge;
    this.tokenBridge = tokenBridge;
    this.tokenRelayer = tokenRelayer;
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

  getTokenBridge(): string {
    return this.tokenBridge;
  }

  getTokenRelayer(): string | undefined {
    if (this.tokenRelayer) {
      return this.tokenRelayer;
    }
    throw new Error('Wormhole relayer configuration missing');
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
