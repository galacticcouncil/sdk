import { Observable } from 'rxjs';

import { Asset, AssetAmount } from '../asset';
import { NearBalanceClient, NearBalanceType } from './balance';
import {
  Chain,
  ChainAssetData,
  ChainCurrency,
  ChainParams,
  ChainType,
} from './Chain';

import { Wormhole, WormholeDef } from '../bridge';
import { NearClient } from '../near';
import { addr } from '../utils';

const { NearAddr } = addr;

const NEAR_NATIVE = 'NEAR';
const NEAR_DECIMALS = 24;

export interface NearChainParams extends ChainParams<
  ChainAssetData,
  NearBalanceType
> {
  /** JSON-RPC endpoint. */
  rpc: string;
  /** Balance poll period, ms. Defaults to the shared interval. */
  pollInterval?: number;
  wormhole?: WormholeDef;
}

/**
 * NEAR, as a standalone chain.
 *
 * - Transfers only where a wormhole deployment is declared (ntt)
 * - Reads and submits over plain JSON-RPC, so it pulls in no NEAR client
 *   library
 */
export class NearChain extends Chain<ChainAssetData, NearBalanceType> {
  private readonly balanceClient = new NearBalanceClient(this);

  private clientCache?: NearClient;

  readonly rpc: string;
  readonly pollInterval?: number;
  readonly wormhole?: Wormhole;

  constructor({ rpc, pollInterval, wormhole, ...others }: NearChainParams) {
    super({ ...others });
    this.rpc = rpc;
    this.pollInterval = pollInterval;
    this.wormhole = wormhole && new Wormhole(wormhole);
  }

  get client(): NearClient {
    if (!this.clientCache) {
      this.clientCache = new NearClient(this.rpc);
    }
    return this.clientCache;
  }

  getType(): ChainType {
    return ChainType.NearChain;
  }

  /** NEAR keys balances by account id — named or 64-hex implicit. */
  override isValidAddress(address: string): boolean {
    return NearAddr.isValid(address);
  }

  async getCurrency(): Promise<ChainCurrency> {
    const asset = this.getAsset(NEAR_NATIVE.toLowerCase());
    if (asset) {
      return { asset, decimals: NEAR_DECIMALS } as ChainCurrency;
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
