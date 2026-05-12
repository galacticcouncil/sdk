import { AnyChain } from '../chain';

export type AcrossDef = {
  spokePool: string;
  multicallHandler: string;
  snowbridgeL2Adaptor?: string;
  snowbridgeL1Adaptor?: string;
};

export class Across {
  readonly spokePool: string;
  readonly multicallHandler: string;
  readonly snowbridgeL2Adaptor?: string;
  readonly snowbridgeL1Adaptor?: string;

  constructor({
    spokePool,
    multicallHandler,
    snowbridgeL2Adaptor,
    snowbridgeL1Adaptor,
  }: AcrossDef) {
    this.spokePool = spokePool;
    this.multicallHandler = multicallHandler;
    this.snowbridgeL2Adaptor = snowbridgeL2Adaptor;
    this.snowbridgeL1Adaptor = snowbridgeL1Adaptor;
  }

  static fromChain(chain: AnyChain): Across {
    if ('across' in chain && !!chain['across']) {
      return chain.across as Across;
    }
    throw new Error(chain.name + ' is not supported in Across.');
  }

  static isKnown(chain: AnyChain): boolean {
    return 'across' in chain && !!chain['across'];
  }

  getSpokePool(): string {
    return this.spokePool;
  }

  getMulticallHandler(): string {
    return this.multicallHandler;
  }

  getSnowbridgeL2Adaptor(): string | undefined {
    return this.snowbridgeL2Adaptor;
  }

  getSnowbridgeL1Adaptor(): string | undefined {
    return this.snowbridgeL1Adaptor;
  }
}
