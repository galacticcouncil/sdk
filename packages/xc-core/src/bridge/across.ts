import { AnyChain } from '../chain';

export type AcrossDef = {
  spokePool: string;
  multicallHandler: string;
  snowbridgeL2Adaptor?: string;
  snowbridgeL1Adaptor?: string;
  // Ethereum-side swap surface used by the L2 adaptor's multicall to convert
  // a portion of the bridged ERC20 to WETH for the Snowbridge inbound fee.
  // Populated on the Ethereum chain's Across config; absent on L2 source chains.
  swapRouter?: string;
  swapQuoter?: string;
  l1FeeToken?: string;
};

export class Across {
  readonly spokePool: string;
  readonly multicallHandler: string;
  readonly snowbridgeL2Adaptor?: string;
  readonly snowbridgeL1Adaptor?: string;
  readonly swapRouter?: string;
  readonly swapQuoter?: string;
  readonly l1FeeToken?: string;

  constructor({
    spokePool,
    multicallHandler,
    snowbridgeL2Adaptor,
    snowbridgeL1Adaptor,
    swapRouter,
    swapQuoter,
    l1FeeToken,
  }: AcrossDef) {
    this.spokePool = spokePool;
    this.multicallHandler = multicallHandler;
    this.snowbridgeL2Adaptor = snowbridgeL2Adaptor;
    this.snowbridgeL1Adaptor = snowbridgeL1Adaptor;
    this.swapRouter = swapRouter;
    this.swapQuoter = swapQuoter;
    this.l1FeeToken = l1FeeToken;
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

  getSwapRouter(): string | undefined {
    return this.swapRouter;
  }

  getSwapQuoter(): string | undefined {
    return this.swapQuoter;
  }

  getL1FeeToken(): string | undefined {
    return this.l1FeeToken;
  }
}
