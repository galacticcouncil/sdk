import {
  Asset,
  AssetAmount,
  Parachain,
  TransferConfig,
} from '@galacticcouncil/xc-core';

import { getDecimals } from './utils';
import { PlatformAdapter } from '../platforms';

export abstract class DataProcessor {
  readonly adapter: PlatformAdapter;
  readonly config: TransferConfig;

  constructor(adapter: PlatformAdapter, config: TransferConfig) {
    this.adapter = adapter;
    this.config = config;
  }

  async getEd(): Promise<AssetAmount | undefined> {
    const { chain } = this.config;
    return chain instanceof Parachain
      ? chain.getExistentialDeposit()
      : undefined;
  }

  async getBalance(address: string): Promise<AssetAmount> {
    return this.config.chain.getBalance(this.config.route.source.asset, address);
  }

  async getMin(): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const asset = route.source.asset;
    if (chain instanceof Parachain) {
      return chain.getMin(asset);
    }
    const decimals = await getDecimals(chain, asset);
    return AssetAmount.fromAsset(asset, { amount: 0n, decimals });
  }

  protected async getDecimals(asset: Asset): Promise<number> {
    return getDecimals(this.config.chain, asset);
  }
}
