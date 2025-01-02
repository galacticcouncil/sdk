import {
  AnyChain,
  Asset,
  AssetAmount,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { SubstrateService } from '../platforms';

export class Metadata {
  readonly chain: AnyChain;

  constructor(chain: AnyChain) {
    this.chain = chain;
  }

  async getDecimals(asset: Asset): Promise<number> {
    const decimals = this.chain.getAssetDecimals(asset);
    if (decimals) {
      return decimals;
    }

    const chainCurrency = await this.chain.getCurrency();
    return chainCurrency.decimals;
  }

  async getEd(): Promise<AssetAmount | undefined> {
    if (this.chain instanceof Parachain) {
      const substrate = await SubstrateService.create(this.chain);
      return substrate.existentialDeposit;
    }
    return undefined;
  }
}
