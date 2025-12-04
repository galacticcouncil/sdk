import { keccak256, stringToBytes, stringToHex } from 'viem';

import { AnyChain, EvmChain, Parachain } from '../chain';

export type HyperbridgeDef = {
  id: number;
  gateway: string;
};

export class Hyperbridge {
  readonly id: number;
  readonly gateway: string;

  constructor({ id, gateway }: HyperbridgeDef) {
    this.id = id;
    this.gateway = gateway;
  }

  static fromChain(chain: AnyChain): Hyperbridge {
    if ('hyperbridge' in chain && !!chain['hyperbridge']) {
      return chain.hyperbridge as Hyperbridge;
    }
    throw new Error(chain.name + ' is not supported.');
  }

  static isKnown(chain: AnyChain): boolean {
    return 'hyperbridge' in chain && !!chain['hyperbridge'];
  }

  getConsensusId(): number {
    return this.id;
  }

  getGateway(): string {
    return this.gateway;
  }

  getAssetId(symbol: string): `0x${string}` {
    return keccak256(stringToBytes(symbol));
  }

  getDest(chain: AnyChain) {
    if (chain instanceof Parachain) {
      return stringToHex('POLKADOT-' + chain.parachainId);
    }
    if (chain instanceof EvmChain) {
      return stringToHex('EVM-' + chain.id);
    }
    throw new Error('Unsupported chain ' + chain.key);
  }
}
