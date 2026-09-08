import { Observable } from 'rxjs';

import { Asset, AssetAmount } from '../../asset';

import { ZecBalanceType } from './types';
import { pollBalance } from './utils';

import type { ZecChain } from '../ZecChain';

/**
 * Reads transparent zcash balances. Owned by {@link ZecChain}.
 *
 * - Zcash is UTXO, so a balance needs an indexer rather than an account read
 * - The reader is supplied by config; no provider is baked in here
 */
export class ZecBalanceClient {
  constructor(private readonly chain: ZecChain) {}

  async getBalance(
    asset: Asset,
    account: string,
    type: ZecBalanceType
  ): Promise<AssetAmount> {
    switch (type) {
      case ZecBalanceType.Transparent: {
        const reader = this.chain.balanceReader;
        if (!reader) {
          throw new Error(
            `No balance reader configured for ${this.chain.key}. ` +
              'Zcash balances require an indexer.'
          );
        }
        const decimals = this.chain.getAssetDecimals(asset) ?? 8;
        return AssetAmount.fromAsset(asset, {
          amount: await reader(account),
          decimals,
        });
      }
      default:
        throw new Error('Unsupported zec balance type: ' + type);
    }
  }

  subscribe(
    asset: Asset,
    account: string,
    type: ZecBalanceType
  ): Observable<AssetAmount> {
    return pollBalance(
      () => this.getBalance(asset, account, type),
      asset.key,
      this.chain.pollInterval
    );
  }
}
