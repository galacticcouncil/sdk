import { Connection } from '@solana/web3.js';

import { Observable } from 'rxjs';

import { Asset, AssetAmount } from '../asset';
import { SolanaBalanceClient, SolanaBalanceType } from './balance';
import {
  Chain,
  ChainAssetData,
  ChainCurrency,
  ChainParams,
  ChainRpcs,
  ChainType,
} from './Chain';

import { Wormhole, WormholeDef } from '../bridge';

const SOLANA_NATIVE = 'SOL';
const SOLANA_DECIMALS = 9;

export interface SolanaChainParams
  extends ChainParams<ChainAssetData, SolanaBalanceType> {
  id: number;
  rpcUrls: ChainRpcs;
  wormhole?: WormholeDef;
}

export class SolanaChain extends Chain<ChainAssetData, SolanaBalanceType> {
  private readonly balanceClient = new SolanaBalanceClient(this);

  readonly id: number;
  readonly rpcUrls: ChainRpcs;
  readonly wormhole?: Wormhole;

  constructor({ id, rpcUrls, wormhole, ...others }: SolanaChainParams) {
    super({ ...others });
    this.id = id;
    this.rpcUrls = rpcUrls;
    this.wormhole = wormhole && new Wormhole(wormhole);
  }

  get connection(): Connection {
    const { http, webSocket } = this.rpcUrls;

    return new Connection(http[0], {
      wsEndpoint: webSocket[0],
      commitment: 'confirmed',
    });
  }

  getType(): ChainType {
    return ChainType.SolanaChain;
  }

  async getCurrency(): Promise<ChainCurrency> {
    const asset = this.getAsset(SOLANA_NATIVE.toLowerCase());
    if (asset) {
      return { asset, decimals: SOLANA_DECIMALS } as ChainCurrency;
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
