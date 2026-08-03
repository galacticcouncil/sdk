import { log } from '@galacticcouncil/common';

import {
  defer,
  distinctUntilChanged,
  finalize,
  Observable,
  Subject,
} from 'rxjs';

import { SolanaAddress } from '@wormhole-foundation/sdk-solana';
import { PublicKey } from '@solana/web3.js';

import { Asset, AssetAmount } from '../../asset';

import { SolanaBalanceType } from './types';

import type { SolanaChain } from '../SolanaChain';

const { logger } = log;

const NATIVE_DECIMALS = 9;

/**
 * Reads solana balances (native + spl token) from a chain's connection. Owned
 * by {@link SolanaChain}.
 */
export class SolanaBalanceClient {
  constructor(private readonly chain: SolanaChain) {}

  async getBalance(
    asset: Asset,
    account: string,
    type: SolanaBalanceType
  ): Promise<AssetAmount> {
    const { connection } = this.chain;
    const owner = new SolanaAddress(account).unwrap();

    switch (type) {
      case SolanaBalanceType.Native: {
        const balance = await connection.getBalance(owner);
        return AssetAmount.fromAsset(asset, {
          amount: BigInt(balance),
          decimals: NATIVE_DECIMALS,
        });
      }
      case SolanaBalanceType.Token: {
        const token = this.chain.getBalanceAssetId(asset);
        if (!token) {
          throw new Error(`Invalid token address: ${asset.key}`);
        }
        const mint = new SolanaAddress(token.toString()).unwrap();
        const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
          mint,
        });
        const amount = accounts.value.reduce(
          (sum: bigint, { account: acc }) => {
            return sum + BigInt(acc.data.parsed.info.tokenAmount.amount);
          },
          0n
        );

        const decimals =
          accounts.value.at(0)?.account.data.parsed.info.tokenAmount.decimals ??
          this.chain.getAssetDecimals(asset) ??
          (await connection.getTokenSupply(mint)).value.decimals;
        return AssetAmount.fromAsset(asset, {
          amount: amount,
          decimals: decimals,
        });
      }
      default:
        throw new Error('Unsupported solana balance type: ' + type);
    }
  }

  // Deferred so retry (Chain.isolateBalances) rebuilds the listener.
  subscribe(
    asset: Asset,
    account: string,
    type: SolanaBalanceType
  ): Observable<AssetAmount> {
    return defer(() => {
      const { connection } = this.chain;
      const subject = new Subject<AssetAmount>();

      const run = async () => {
        const update = async () =>
          subject.next(await this.getBalance(asset, account, type));
        await update();
        // Later failures ride the next update; erroring would kill the stream.
        const id = connection.onAccountChange(new PublicKey(account), () =>
          update().catch((err) =>
            logger.warn(`Balance update failed for ${asset.key}:`, err)
          )
        );
        return () => {
          connection.removeAccountChangeListener(id);
        };
      };

      let disconnect: (() => void) | undefined;
      let closed = false;
      // A failed first read must error, or the subject silently never emits.
      run()
        .then((unsub) => (closed ? unsub() : (disconnect = unsub)))
        .catch((err) => subject.error(err));

      return subject.pipe(
        finalize(() => {
          closed = true;
          disconnect?.();
        }),
        distinctUntilChanged((prev, curr) => prev.amount === curr.amount)
      );
    });
  }
}
