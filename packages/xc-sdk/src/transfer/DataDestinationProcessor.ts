import { AnyChain, Asset, AssetAmount, Parachain } from '@galacticcouncil/xc-core';

import { getDecimals } from './utils';
import { PlatformAdapter } from '../platforms';

/**
 * Resolves destination-side transfer data (received balance, minimum,
 * existential deposit) directly from the destination chain.
 *
 * Thin wrapper over the chain's own balance reads — kept so one-way routes
 * resolve destination data without a reverse `TransferConfig`.
 */
export class DataDestinationProcessor {
  readonly adapter: PlatformAdapter;
  readonly chain: AnyChain;
  readonly asset: Asset;

  constructor(adapter: PlatformAdapter, chain: AnyChain, asset: Asset) {
    this.adapter = adapter;
    this.chain = chain;
    this.asset = asset;
  }

  async getEd(): Promise<AssetAmount | undefined> {
    return this.chain instanceof Parachain
      ? this.chain.getExistentialDeposit()
      : undefined;
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
}
