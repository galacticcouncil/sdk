import { Observable } from 'rxjs';

import { Asset, AssetAmount } from '../../asset';

import { NearBalanceType } from './types';
import { pollBalance } from './utils';

import type { NearChain } from '../NearChain';

/**
 * Reads near balances over the chain's JSON-RPC. Owned by {@link NearChain}.
 */
export class NearBalanceClient {
  constructor(private readonly chain: NearChain) {}

  async getBalance(
    asset: Asset,
    account: string,
    type: NearBalanceType
  ): Promise<AssetAmount> {
    const decimals = this.chain.getAssetDecimals(asset) ?? 24;
    const amount = await this.readBalance(asset, account, type);
    return AssetAmount.fromAsset(asset, { amount, decimals });
  }

  subscribe(
    asset: Asset,
    account: string,
    type: NearBalanceType
  ): Observable<AssetAmount> {
    return pollBalance(
      () => this.getBalance(asset, account, type),
      asset.key,
      this.chain.pollInterval
    );
  }

  /**
   * Raw balance of an account.
   *
   * - An account that does not exist reads as zero rather than blanking
   *   the balance, as does one the token never registered
   *
   * @param asset - native near, or a token keyed by its contract account
   * @param account - NEAR account id
   * @param type - balance storage of the asset
   */
  private async readBalance(
    asset: Asset,
    account: string,
    type: NearBalanceType
  ): Promise<bigint> {
    const { client } = this.chain;
    switch (type) {
      case NearBalanceType.Native: {
        const view = await client.viewAccount(account);
        return view ? BigInt(view.amount) : 0n;
      }
      case NearBalanceType.Ft: {
        const token = this.chain.getBalanceAssetId(asset).toString();
        const balance = await client.view<string>(token, 'ft_balance_of', {
          account_id: account,
        });
        return BigInt(balance);
      }
      default:
        throw new Error('Unsupported near balance type: ' + type);
    }
  }
}
