import { big, log } from '@galacticcouncil/common';

import {
  defer,
  distinctUntilChanged,
  finalize,
  Observable,
  Subject,
} from 'rxjs';

import { Asset, AssetAmount, AssetAmountParams } from '../../asset';

import type { AnyParachain } from '../types';

const { logger } = log;

/** Default poll period for chains with no balance subscription of their own. */
export const BALANCE_POLL_INTERVAL = 3000;

/**
 * Normalize asset amount if chain uses solely chain decimals for balance
 * representation of assets.
 */
export async function normalizeAssetAmount(
  amount: bigint,
  asset: Asset,
  chain: AnyParachain
): Promise<AssetAmountParams> {
  const { decimals: chainDecimals } = await chain.getCurrency();
  const assetDecimals = chain.getAssetDecimals(asset) ?? chainDecimals;
  const normDecimals = chain.usesChainDecimals ? chainDecimals : assetDecimals;
  const normBalance = big.convertDecimals(amount, normDecimals, assetDecimals);
  return {
    amount: normBalance,
    decimals: assetDecimals,
  };
}

/**
 * Poll a balance on an interval, as an observable.
 *
 * - Deferred, so a retry rebuilds the poll rather than resubscribing a dead one
 * - A failed first read errors the stream, or it would silently never emit
 * - Later failures are warned and skipped, keeping the stream alive
 * - Emits only on a changed amount
 *
 * @param read - fetches the current balance
 * @param label - asset key, used in warnings
 * @param intervalMs - poll period
 */
export function pollBalance(
  read: () => Promise<AssetAmount>,
  label: string,
  intervalMs: number = BALANCE_POLL_INTERVAL
): Observable<AssetAmount> {
  return defer(() => {
    const subject = new Subject<AssetAmount>();

    const run = async () => {
      const update = async () => subject.next(await read());
      await update();
      const intervalId = setInterval(
        () =>
          update().catch((err) =>
            logger.warn(`Balance update failed for ${label}:`, err)
          ),
        intervalMs
      );
      return () => clearInterval(intervalId);
    };

    let disconnect: (() => void) | undefined;
    let closed = false;
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
