import { ApiPromise } from '@polkadot/api';

import {
  Observable,
  Subject,
  shareReplay,
  finalize,
  distinctUntilChanged,
  map,
  distinct,
} from 'rxjs';

import { BalanceClient } from './BalanceClient';
import { BigNumber, ZERO } from '../utils/bignumber';

export type AssetBalance = [string, BigNumber];

export class BalanceClientV2 extends BalanceClient {
  constructor(api: ApiPromise) {
    super(api);
  }

  async subscribe(address: string): Promise<Observable<AssetBalance[]>> {
    const subject = new Subject<AssetBalance[]>();
    const observable = subject.pipe(shareReplay(1));

    const run = async () => {
      const getBalances = async () => {
        const result: AssetBalance[] = [];
        const balances = await this.getAccountBalanceData(address);
        balances.forEach(([token, data]) => {
          result.push([token.toString(), this.calculateFreeBalance(data)]);
        });
        subject.next(result);
      };

      await getBalances();
      const unsub = await this.api.rpc.chain.subscribeNewHeads(async () => {
        getBalances();
      });

      return () => unsub();
    };

    let disconnect: () => void;
    run().then((unsub) => (disconnect = unsub));

    return observable.pipe(
      finalize(() => disconnect?.()),
      distinctUntilChanged((prev, curr) => prev === curr)
    ) as Observable<AssetBalance[]>;
  }
}
