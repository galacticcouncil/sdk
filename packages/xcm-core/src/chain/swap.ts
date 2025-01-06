import { Asset, AssetAmount } from '../asset';
import { AnyChain } from './types';

export type SwapQuote = {
  amount: bigint;
  route: {};
};

export interface Swap {
  chain: AnyChain;

  getQuote(
    assetIn: Asset,
    assetOut: Asset,
    amountOut: AssetAmount
  ): Promise<SwapQuote>;
}

export class SwapFactory {
  private static _instance: SwapFactory = new SwapFactory();

  private _swaps: Map<string, Swap> = new Map([]);

  constructor() {
    if (SwapFactory._instance) {
      throw new Error('Use SwapFactory.getInstance() instead of new.');
    }
    SwapFactory._instance = this;
  }

  public static getInstance(): SwapFactory {
    return SwapFactory._instance;
  }

  public register(swap: Swap) {
    this._swaps.set(swap.chain.key, swap);
  }

  public get(key: string): Swap | undefined {
    return this._swaps.get(key);
  }
}
