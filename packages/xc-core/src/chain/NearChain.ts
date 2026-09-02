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

import { addr } from '../utils';

const { NearAddr } = addr;

const NEAR_NATIVE = 'NEAR';
const NEAR_DECIMALS = 24;

export interface NearChainParams
  extends ChainParams<ChainAssetData, NearBalanceType> {
  /** JSON-RPC endpoint. */
  rpc: string;
  /** Balance poll period, ms. Defaults to the shared interval. */
  pollInterval?: number;
}

/**
 * NEAR mainnet, as a standalone chain.
 *
 * - Balances and address validation only; it carries no transfer routes
 * - Reads over plain JSON-RPC, so it pulls in no NEAR client library
 */
export class NearChain extends Chain<ChainAssetData, NearBalanceType> {
  private readonly balanceClient = new NearBalanceClient(this);

  readonly rpc: string;
  readonly pollInterval?: number;

  constructor({ rpc, pollInterval, ...others }: NearChainParams) {
    super({ ...others });
    this.rpc = rpc;
    this.pollInterval = pollInterval;
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
