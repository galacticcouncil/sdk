import { Asset, AssetAmount } from '@moonbeam-network/xcm-types';

import {
  Observable,
  Subject,
  shareReplay,
  finalize,
  distinctUntilChanged,
} from 'rxjs';

import { EvmBalance } from './evm';
import { BalanceProvider } from '../types';
import { EvmClient } from '../../evm';

export class EthereumBalance implements BalanceProvider<EvmBalance> {
  readonly #client: EvmClient;

  constructor(client: EvmClient) {
    this.#client = client;
  }

  async read(asset: Asset, contract: EvmBalance): Promise<AssetAmount> {
    const [balance, decimals] = await Promise.all([
      contract.getBalance(),
      contract.getDecimals(),
    ]);
    return AssetAmount.fromAsset(asset, {
      amount: balance,
      decimals: decimals,
    });
  }

  subscribe(asset: Asset, contract: EvmBalance): Observable<AssetAmount> {
    const subject = new Subject<AssetAmount>();
    const observable = subject.pipe(shareReplay(1));
    const provider = this.#client.getProvider();

    const run = async () => {
      const updateBalance = async () => {
        const balance = await this.read(asset, contract);
        subject.next(balance);
      };
      await updateBalance();
      const unsub = provider.watchBlocks({
        onBlock: () => updateBalance(),
      });
      return () => unsub();
    };

    let disconnect: () => void;
    run().then((unsub) => (disconnect = unsub));

    return observable.pipe(
      finalize(() => disconnect?.()),
      distinctUntilChanged((prev, curr) => prev.amount === curr.amount)
    ) as Observable<AssetAmount>;
  }
}
