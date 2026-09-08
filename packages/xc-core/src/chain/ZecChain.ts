import { Observable } from 'rxjs';

import { Asset, AssetAmount } from '../asset';
import { ZecBalanceClient, ZecBalanceType } from './balance';
import {
  Chain,
  ChainAssetData,
  ChainCurrency,
  ChainParams,
  ChainType,
} from './Chain';

import { addr } from '../utils';

const { ZecAddr } = addr;

const ZEC_NATIVE = 'ZEC';
const ZEC_DECIMALS = 8;

/**
 * Reads a transparent address' balance, in zatoshi.
 *
 * - Supplied by config, since Zcash has no canonical public balance API
 */
export type ZecBalanceReader = (address: string) => Promise<bigint>;

export interface ZecChainParams
  extends ChainParams<ChainAssetData, ZecBalanceType> {
  /** Indexer-backed balance reader. Balances are unavailable without one. */
  balanceReader?: ZecBalanceReader;
  /** Balance poll period, ms. Defaults to the shared interval. */
  pollInterval?: number;
}

/**
 * Zcash mainnet, as a standalone chain.
 *
 * - Transparent addresses only — the forms NEAR Intents can withdraw to
 * - Balances need an indexer; without one, validation and metadata still work
 */
export class ZecChain extends Chain<ChainAssetData, ZecBalanceType> {
  private readonly balanceClient = new ZecBalanceClient(this);

  readonly balanceReader?: ZecBalanceReader;
  readonly pollInterval?: number;

  constructor({ balanceReader, pollInterval, ...others }: ZecChainParams) {
    super({ ...others });
    this.balanceReader = balanceReader;
    this.pollInterval = pollInterval;
  }

  getType(): ChainType {
    return ChainType.ZecChain;
  }

  /**
   * Zcash keys balances by a transparent address.
   *
   * - `t1` and `t3` only; shielded addresses are rejected
   * - Checksum-verified, so a mistyped address fails here
   */
  override isValidAddress(address: string): boolean {
    return ZecAddr.isValid(address);
  }

  async getCurrency(): Promise<ChainCurrency> {
    const asset = this.getAsset(ZEC_NATIVE.toLowerCase());
    if (asset) {
      return { asset, decimals: ZEC_DECIMALS } as ChainCurrency;
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
