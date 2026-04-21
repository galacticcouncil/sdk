import { AnyChain } from '../chain';

export type BasejumpDef = {
  address: string;
};

export class Basejump {
  readonly address: string;

  constructor({ address }: BasejumpDef) {
    this.address = address;
  }

  static fromChain(chain: AnyChain): Basejump {
    if ('basejump' in chain && !!chain['basejump']) {
      return chain.basejump as Basejump;
    }
    throw new Error(chain.name + ' is not supported in Basejump.');
  }

  static isKnown(chain: AnyChain): boolean {
    return 'basejump' in chain && !!chain['basejump'];
  }

  getAddress(): string {
    return this.address;
  }
}
