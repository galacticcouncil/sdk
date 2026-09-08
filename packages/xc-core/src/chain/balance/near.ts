import { Observable } from 'rxjs';

import { Asset, AssetAmount } from '../../asset';

import { NearBalanceType } from './types';
import { pollBalance } from './utils';

import type { NearChain } from '../NearChain';

/** NEAR reports an account that was never created as an error, not as zero. */
const UNKNOWN_ACCOUNT = 'UNKNOWN_ACCOUNT';

interface ViewAccount {
  amount: string;
  locked: string;
  storage_usage: number;
}

interface RpcError {
  cause?: { name?: string };
  message?: string;
}

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
    switch (type) {
      case NearBalanceType.Native: {
        const decimals = this.chain.getAssetDecimals(asset) ?? 24;
        const view = await this.viewAccount(account);
        return AssetAmount.fromAsset(asset, {
          amount: view ? BigInt(view.amount) : 0n,
          decimals,
        });
      }
      default:
        throw new Error('Unsupported near balance type: ' + type);
    }
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
   * Read an account's on-chain state.
   *
   * - Returns `undefined` for an account that does not exist
   * - An unfunded recipient reads as zero rather than blanking the balance
   *
   * @param account - NEAR account id
   */
  private async viewAccount(account: string): Promise<ViewAccount | undefined> {
    const res = await fetch(this.chain.rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'xc-balance',
        method: 'query',
        params: {
          request_type: 'view_account',
          finality: 'final',
          account_id: account,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`near rpc ${res.status}: ${await res.text()}`);
    }

    const body = (await res.json()) as {
      result?: ViewAccount;
      error?: RpcError;
    };

    if (body.error) {
      if (body.error.cause?.name === UNKNOWN_ACCOUNT) {
        return undefined;
      }
      throw new Error(`near rpc: ${body.error.message ?? 'query failed'}`);
    }

    return body.result;
  }
}
