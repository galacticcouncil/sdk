import { Dex } from './types';

export class DexFactory {
  private static _instance: DexFactory = new DexFactory();

  private _dex: Map<string, Dex> = new Map([]);

  constructor() {
    if (DexFactory._instance) {
      throw new Error('Use DexFactory.getInstance() instead of new.');
    }
    DexFactory._instance = this;
  }

  public static getInstance(): DexFactory {
    return DexFactory._instance;
  }

  public register(dex: Dex) {
    this._dex.set(dex.chain.key, dex);
  }

  public get(key: string): Dex | undefined {
    return this._dex.get(key);
  }
}
