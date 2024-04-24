import {
  AnyChain,
  Asset,
  AssetAmount,
  EvmChain,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { SubstrateService } from 'substrate';

export class MetadataUtils {
  readonly chain: AnyChain;

  constructor(chain: AnyChain) {
    this.chain = chain;
  }

  async getDecimals(asset: Asset): Promise<number> {
    const decimals = this.chain.getAssetDecimals(asset);
    if (decimals) {
      return decimals;
    }

    if (this.chain instanceof Parachain) {
      const substrate = await SubstrateService.create(this.chain);
      return substrate.decimals;
    }

    if (this.chain instanceof EvmChain) {
      return this.chain.client.chainDecimals;
    }

    throw new Error('Unknown asset decimals: ' + asset.key);
  }

  async getEd(): Promise<AssetAmount | undefined> {
    if (this.chain instanceof Parachain) {
      const substrate = await SubstrateService.create(this.chain);
      return substrate.existentialDeposit;
    }
    return undefined;
  }
}
