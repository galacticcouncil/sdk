import {
  AnyChain,
  Asset,
  AssetAmount,
  Parachain,
} from '@galacticcouncil/xc-core';

import { getDecimals } from './utils';
import { PlatformAdapter } from '../platforms';

/**
 * Resolves chain-side transfer data (balance, minimum, existential deposit)
 * for a given `(chain, asset)` directly from the chain. Shared by the origin
 * and destination processors — the origin sources `(chain, asset)` from its
 * `TransferConfig`, the destination receives them directly (one-way routes
 * have no reverse config).
 */
export abstract class DataProcessor {
  readonly adapter: PlatformAdapter;
  readonly chain: AnyChain;
  readonly asset: Asset;

  constructor(adapter: PlatformAdapter, chain: AnyChain, asset: Asset) {
    this.adapter = adapter;
    this.chain = chain;
    this.asset = asset;
  }

  async getEd(): Promise<AssetAmount | undefined> {
    return this.chain instanceof Parachain ? this.chain.getEd() : undefined;
  }

  async getBalance(address: string): Promise<AssetAmount> {
    return this.chain.getBalance(this.asset, address);
  }

  async getMin(): Promise<AssetAmount> {
    if (this.chain instanceof Parachain) {
      return this.chain.getMin(this.asset);
    }
    const decimals = await getDecimals(this.chain, this.asset);
    return AssetAmount.fromAsset(this.asset, { amount: 0n, decimals });
  }

  protected async getDecimals(asset: Asset): Promise<number> {
    return getDecimals(this.chain, asset);
  }
}
