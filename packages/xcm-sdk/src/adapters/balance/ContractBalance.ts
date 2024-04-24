import {
  AnyEvmChain,
  Asset,
  AssetAmount,
  ContractConfig,
  EvmClient,
} from '@galacticcouncil/xcm-core';

import {
  Observable,
  Subject,
  shareReplay,
  finalize,
  distinctUntilChanged,
} from 'rxjs';

import { EvmBalanceFactory } from './evm';
import { BalanceProvider } from '../types';

export class ContractBalance implements BalanceProvider<ContractConfig> {
  readonly #client: EvmClient;

  constructor(chain: AnyEvmChain) {
    this.#client = chain.client;
  }

  async read(asset: Asset, config: ContractConfig): Promise<AssetAmount> {
    const contract = EvmBalanceFactory.get(this.#client, config);
    const [balance, decimals] = await Promise.all([
      contract.getBalance(),
      contract.getDecimals(),
    ]);
    return AssetAmount.fromAsset(asset, {
      amount: balance,
      decimals: decimals,
    });
  }

  async subscribe(
    asset: Asset,
    config: ContractConfig
  ): Promise<Observable<AssetAmount>> {
    const subject = new Subject<AssetAmount>();
    const observable = subject.pipe(shareReplay(1));
    const provider = this.#client.getProvider();

    const run = async () => {
      const updateBalance = async () => {
        const balance = await this.read(asset, config);
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
