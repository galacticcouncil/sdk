import { log } from '@galacticcouncil/common';

import {
  defer,
  distinctUntilChanged,
  finalize,
  Observable,
  Subject,
} from 'rxjs';

import { SUI_TYPE_ARG } from '@mysten/sui/utils';

import { Asset, AssetAmount } from '../../asset';

import { SuiBalanceType } from './types';

import type { SuiChain } from '../SuiChain';

const { logger } = log;

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

  // Deferred so retry (Chain.isolateBalances) restarts the poll.
  subscribe(
    asset: Asset,
    account: string,
    type: SuiBalanceType
  ): Observable<AssetAmount> {
    return defer(() => {
      const subject = new Subject<AssetAmount>();

      const run = async () => {
        const update = async () =>
          subject.next(await this.getBalance(asset, account, type));
        await update();
        // Later failures ride the next update; erroring would kill the stream.
        const intervalId = setInterval(
          () =>
            update().catch((err) =>
              logger.warn(`Balance update failed for ${asset.key}:`, err)
            ),
          3000
        );
        return () => clearInterval(intervalId);
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
