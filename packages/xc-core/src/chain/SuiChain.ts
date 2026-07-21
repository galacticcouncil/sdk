import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

import { Observable } from 'rxjs';

import { Asset, AssetAmount } from '../asset';
import { SuiBalanceClient, SuiBalanceType } from './balance';
import {
  Chain,
  ChainAssetData,
  ChainCurrency,
  ChainParams,
  ChainType,
} from './Chain';

import { Wormhole, WormholeDef } from '../bridge';

const SUI_NATIVE = 'SUI';
const SUI_DECIMALS = 9;

export interface SuiChainParams
  extends ChainParams<ChainAssetData, SuiBalanceType> {
  id: string;
  wormhole?: WormholeDef;
}

export class SuiChain extends Chain<ChainAssetData, SuiBalanceType> {
  private readonly balanceClient = new SuiBalanceClient(this);

  private clientCache?: SuiClient;

  readonly id: string;
  readonly wormhole?: Wormhole;

  constructor({ id, wormhole, ...others }: SuiChainParams) {
    super({ ...others });
    this.id = id;
    this.wormhole = wormhole && new Wormhole(wormhole);
  }

  /**
   * Memoized. The balance subscription polls on an interval, so building a
   * client per read means a new client every tick.
   */
  get client(): SuiClient {
    if (!this.clientCache) {
      const rpcUrl = getFullnodeUrl('mainnet');
      this.clientCache = new SuiClient({ url: rpcUrl });
    }
    return this.clientCache;
  }

  getType(): ChainType {
    return ChainType.SuiChain;
  }

  async getCurrency(): Promise<ChainCurrency> {
    const asset = this.getAsset(SUI_NATIVE.toLowerCase());
    if (asset) {
      return { asset, decimals: SUI_DECIMALS } as ChainCurrency;
    }
    throw Error('Chain currency configuration not found');
  }

  async getBalance(asset: Asset, address: string): Promise<AssetAmount> {
    return this.balanceClient.getBalance(
      asset,
      address,
      this.getBalanceType(asset)
    );
  }

  subscribeBalance(asset: Asset, address: string): Observable<AssetAmount> {
    return this.balanceClient.subscribe(
      asset,
      address,
      this.getBalanceType(asset)
    );
  }
}
