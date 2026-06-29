import {
  distinctUntilChanged,
  finalize,
  shareReplay,
  Observable,
  Subject,
} from 'rxjs';

import { SUI_TYPE_ARG } from '@mysten/sui/utils';

import { Asset, AssetAmount } from '../../asset';

import { SuiBalanceType } from './types';

import type { SuiChain } from '../SuiChain';

const NATIVE_DECIMALS = 9;

/**
 * Reads sui balances from a chain's client. Owned by {@link SuiChain}.
 */
export class SuiBalanceClient {
  constructor(private readonly chain: SuiChain) {}

  async getBalance(
    asset: Asset,
    account: string,
    type: SuiBalanceType
  ): Promise<AssetAmount> {
    switch (type) {
      case SuiBalanceType.Native: {
        const balance = await this.chain.client.getBalance({
          owner: account,
          coinType: SUI_TYPE_ARG,
        });
        return AssetAmount.fromAsset(asset, {
          amount: BigInt(balance.totalBalance),
          decimals: NATIVE_DECIMALS,
        });
      }
      default:
        throw new Error('Unsupported sui balance type: ' + type);
    }
  }

  subscribe(
    asset: Asset,
    account: string,
    type: SuiBalanceType
  ): Observable<AssetAmount> {
    const subject = new Subject<AssetAmount>();
    const observable = subject.pipe(shareReplay(1));

    const run = async () => {
      const update = async () =>
        subject.next(await this.getBalance(asset, account, type));
      await update();
      const intervalId = setInterval(() => update(), 3000);
      return () => clearInterval(intervalId);
    };

    let disconnect: () => void;
    run().then((unsub) => (disconnect = unsub));

    return observable.pipe(
      finalize(() => disconnect?.()),
      distinctUntilChanged((prev, curr) => prev.amount === curr.amount)
    ) as Observable<AssetAmount>;
  }
}
