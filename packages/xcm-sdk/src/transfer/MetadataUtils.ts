import {
  AnyChain,
  Asset,
  AssetAmount,
  EvmChain,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { SubstrateService } from '../substrate';

export class MetadataUtils {
  readonly chain: AnyChain;

  constructor(chain: AnyChain) {
    this.chain = chain;
  }

  async getDecimals(asset: Asset): Promise<number> {
    const normalizedAsset = this.normalizeAsset(asset);
    const decimals = this.chain.getAssetDecimals(normalizedAsset);
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

  private normalizeAsset(asset: Asset) {
    const isEvm = this.chain.isEvmChain();
    if (isEvm) {
      const { key } = asset;
      return {
        ...asset,
        key: key.split('_')[0],
      } as Asset;
    }
    return asset;
  }
}
