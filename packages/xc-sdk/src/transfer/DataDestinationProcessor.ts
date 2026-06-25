import {
  addr,
  AnyChain,
  Asset,
  AssetAmount,
  Parachain,
} from '@galacticcouncil/xc-core';
import { big } from '@galacticcouncil/common';

import { formatEvmAddress, getDecimals } from './utils';
import { PlatformAdapter } from '../platforms';
import { SubstrateService } from '../platforms';

const { EvmAddr } = addr;

/**
 * Resolves destination-side transfer data (received balance, minimum,
 * existential deposit) directly from the destination chain registry.
 *
 * Unlike the origin {@link DataProcessor}, this does not require a reverse
 * `TransferConfig` to exist — balance/min builders are read from the chain
 * itself, which unblocks one-way routes.
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
    if (this.chain instanceof Parachain) {
      const substrate = await SubstrateService.create(this.chain);
      return substrate.getExistentialDeposit();
    }
    return undefined;
  }

  async getBalance(address: string): Promise<AssetAmount> {
    const { asset, chain } = this;

    const assetId = chain.getBalanceAssetId(asset);
    const account = EvmAddr.isValid(assetId.toString())
      ? await formatEvmAddress(address, chain)
      : address;

    const balanceConfig = chain.getBalanceBuilder(asset).build({
      address: account,
      asset: asset,
      chain: chain,
    });

    return this.adapter.getBalance(asset, balanceConfig);
  }

  async getMin(): Promise<AssetAmount> {
    const { asset, chain } = this;
    const min = chain.getMinBuilder();

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
    const { asset, chain } = this;

    const min = chain.getAssetMin(asset);
    const decimals = await getDecimals(chain, asset);

    let balance: bigint = 0n;
    if (min) {
      balance = big.toBigInt(min, decimals);
    }

    return AssetAmount.fromAsset(asset, {
      amount: balance,
      decimals: decimals,
    });
  }
}
