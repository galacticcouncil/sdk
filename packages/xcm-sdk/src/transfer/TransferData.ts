import {
  addr,
  big,
  Asset,
  AssetAmount,
  Parachain,
  TransferConfig,
} from '@galacticcouncil/xcm-core';

import { formatEvmAddress } from './utils';
import { PlatformAdapter, SubstrateService } from '../platforms';

export abstract class TransferData {
  readonly adapter: PlatformAdapter;
  readonly config: TransferConfig;

  constructor(adapter: PlatformAdapter, config: TransferConfig) {
    this.adapter = adapter;
    this.config = config;
  }

  async getEd(): Promise<AssetAmount | undefined> {
    const { chain } = this.config;

    if (chain instanceof Parachain) {
      const substrate = await SubstrateService.create(chain);
      return substrate.existentialDeposit;
    }
    return undefined;
  }

  async getBalance(address: string): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { source } = route;

    const asset = source.asset;

    const assetId = chain.getBalanceAssetId(asset);
    const account = addr.isH160(assetId.toString())
      ? await formatEvmAddress(address, chain)
      : address;
    const balanceConfig = route.source.balance.build({
      address: account,
      asset: asset,
      chain: chain,
    });

    return this.adapter.getBalance(asset, balanceConfig);
  }

  async getMin(): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { source } = route;

    const asset = source.asset;
    const min = source.min;

    if (chain instanceof Parachain && min) {
      const minAssetId = chain.getMinAssetId(asset);
      const minBalanceConfig = min.build({
        asset: minAssetId,
      });
      return this.adapter.getBalance(asset, minBalanceConfig);
    }

    return this.getAssetMin();
  }

  private async getAssetMin(): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { source } = route;

    const asset = source.asset;
    const min = chain.getAssetMin(asset);
    const decimals = await this.getDecimals(asset);

    let balance: bigint = 0n;
    if (min) {
      balance = big.toBigInt(min, decimals);
    }

    return AssetAmount.fromAsset(asset, {
      amount: balance,
      decimals: decimals,
    });
  }

  protected async getDecimals(asset: Asset): Promise<number> {
    const { chain } = this.config;

    const decimals = chain.getAssetDecimals(asset);
    if (decimals) {
      return decimals;
    }

    const chainCurrency = await chain.getCurrency();
    return chainCurrency.decimals;
  }
}
