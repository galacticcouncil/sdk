import { AnyChain } from 'chain';

export type WormholeDef = {
  id: number;
  coreBridge: string;
  tokenBridge: string;
  tokenRelayer?: string;
};

export class Wormhole {
  readonly id: number;
  readonly coreBridge: string;
  readonly tokenBridge: string;
  readonly tokenRelayer?: string;

  constructor({ id, coreBridge, tokenBridge, tokenRelayer }: WormholeDef) {
    this.id = id;
    this.coreBridge = coreBridge;
    this.tokenBridge = tokenBridge;
    this.tokenRelayer = tokenRelayer;
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
}
