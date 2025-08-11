import {
  Asset,
  AssetAmount,
  MoveConfig,
  SuiChain,
  SuiQueryConfig,
} from '@galacticcouncil/xcm-core';

import { SuiClient } from '@mysten/sui/client';

import {
  distinctUntilChanged,
  finalize,
  shareReplay,
  Observable,
  Subject,
} from 'rxjs';

import { Call, Platform } from '../types';
import { SuiBalanceFactory } from './balance';

export class SuiPlatform implements Platform<MoveConfig, SuiQueryConfig> {
  readonly #client: SuiClient;

  constructor(chain: SuiChain) {
    this.#client = chain.client;
  }

  buildCall(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: MoveConfig
  ): Promise<Call> {
    console.log('here');
    throw new Error('Method not implemented.');
  }

  estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: MoveConfig
  ): Promise<AssetAmount> {
    throw new Error('Method not implemented.');
  }

  async getBalance(asset: Asset, config: SuiQueryConfig): Promise<AssetAmount> {
    const query = SuiBalanceFactory.get(this.#client, config);
    const [balance, decimals] = await Promise.all([
      query.getBalance(),
      query.getDecimals(),
    ]);
    console.log(balance);
    return AssetAmount.fromAsset(asset, {
      amount: balance,
      decimals: decimals,
    });
  }

  async subscribeBalance(
    asset: Asset,
    config: SuiQueryConfig
  ): Promise<Observable<AssetAmount>> {
    throw Error('Fdf');
    const subject = new Subject<AssetAmount>();
    const observable = subject.pipe(shareReplay(1));
    const { address } = config;

    const unsub = await this.#client.subscribeEvent({
      filter: { MoveEventType: '0x2::coin::BalanceChange' },
      onMessage: (event) => {
        console.log(event);
      },
    });

    return observable.pipe(
      finalize(() => unsub()),
      distinctUntilChanged((prev, curr) => prev.amount === curr.amount)
    ) as Observable<AssetAmount>;
  }
}
