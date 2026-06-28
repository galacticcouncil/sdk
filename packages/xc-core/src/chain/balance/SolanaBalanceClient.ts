import {
  distinctUntilChanged,
  finalize,
  shareReplay,
  Observable,
  Subject,
} from 'rxjs';

import { SolanaAddress } from '@wormhole-foundation/sdk-solana';
import { PublicKey } from '@solana/web3.js';

import { Asset, AssetAmount } from '../../asset';

import { BalanceType } from './types';

import type { SolanaChain } from '../SolanaChain';

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
    type: BalanceType
  ): Promise<AssetAmount> {
    const { connection } = this.chain;
    const owner = new SolanaAddress(account).unwrap();

    switch (type) {
      case BalanceType.SolanaNative: {
        const balance = await connection.getBalance(owner);
        return AssetAmount.fromAsset(asset, {
          amount: BigInt(balance),
          decimals: NATIVE_DECIMALS,
        });
      }
      case BalanceType.SolanaToken: {
        const token = this.chain.getBalanceAssetId(asset);
        if (!token) {
          throw new Error(`Invalid token address: ${asset.key}`);
        }
        const mint = new SolanaAddress(token.toString()).unwrap();
        const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
          mint,
        });
        const amount = accounts.value.reduce((sum: bigint, { account: acc }) => {
          return sum + BigInt(acc.data.parsed.info.tokenAmount.amount);
        }, 0n);
        const supply = await connection.getTokenSupply(mint);
        return AssetAmount.fromAsset(asset, {
          amount: amount,
          decimals: supply.value.decimals,
        });
      }
      default:
        throw new Error('Unsupported solana balance type: ' + type);
    }
  }

  subscribe(
    asset: Asset,
    account: string,
    type: BalanceType
  ): Observable<AssetAmount> {
    const { connection } = this.chain;
    const subject = new Subject<AssetAmount>();
    const observable = subject.pipe(shareReplay(1));

    const run = async () => {
      const update = async () =>
        subject.next(await this.getBalance(asset, account, type));
      await update();
      const id = connection.onAccountChange(new PublicKey(account), () =>
        update()
      );
      return () => {
        connection.removeAccountChangeListener(id);
      };
    };

    let disconnect: () => void;
    run().then((unsub) => (disconnect = unsub));

    return observable.pipe(
      finalize(() => disconnect?.()),
      distinctUntilChanged((prev, curr) => prev.amount === curr.amount)
    ) as Observable<AssetAmount>;
  }
}
