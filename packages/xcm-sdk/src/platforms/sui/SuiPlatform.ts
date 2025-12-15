import {
  Asset,
  AssetAmount,
  CallType,
  MoveConfig,
  SuiChain,
  SuiQueryConfig,
} from '@galacticcouncil/xcm-core';

import { SuiClient } from '@mysten/sui/client';
import { toBase64 } from '@mysten/bcs';

import {
  distinctUntilChanged,
  finalize,
  shareReplay,
  Observable,
  Subject,
} from 'rxjs';

import { SuiBalanceFactory } from './balance';
import { SuiCall } from './types';
import { resolveCommandsTyped } from './utils';

import { DryRunResult, Platform } from '../types';

export class SuiPlatform implements Platform<MoveConfig, SuiQueryConfig> {
  readonly #client: SuiClient;

  constructor(chain: SuiChain) {
    this.#client = chain.client;
  }

  async buildCall(
    account: string,
    _amount: bigint,
    _asset: Asset,
    _feeBalance: AssetAmount,
    config: MoveConfig
  ): Promise<SuiCall> {
    const { transaction } = config;

    transaction.setSender(account);

    const txBytes = await transaction.build({ client: this.#client });
    const txJson = await transaction.toJSON();

    const commands = resolveCommandsTyped(JSON.parse(txJson));
    return {
      from: account,
      commands: commands,
      data: toBase64(txBytes),
      type: CallType.Sui,
      dryRun: async () => {
        const sim = await this.#client.dryRunTransactionBlock({
          transactionBlock: txBytes,
        });

        return {
          call: config.module + '.' + config.func,
          error: sim.executionErrorSource,
        } as DryRunResult;
      },
    } as SuiCall;
  }

  async estimateFee(
    account: string,
    _amount: bigint,
    feeBalance: AssetAmount,
    config: MoveConfig
  ): Promise<AssetAmount> {
    const { transaction } = config;

    transaction.setSender(account);
    const txBytes = await transaction.build({ client: this.#client });
    const sim = await this.#client.dryRunTransactionBlock({
      transactionBlock: txBytes,
    });

    const gasUsed = sim.effects.gasUsed;

    const computation = BigInt(gasUsed.computationCost);
    const storage = BigInt(gasUsed.storageCost);
    const rebate = BigInt(gasUsed.storageRebate);
    const mist = computation + storage - rebate;

    return feeBalance.copyWith({ amount: mist });
  }

  async getBalance(asset: Asset, config: SuiQueryConfig): Promise<AssetAmount> {
    const query = SuiBalanceFactory.get(this.#client, config);
    const [balance, decimals] = await Promise.all([
      query.getBalance(),
      query.getDecimals(),
    ]);
    return AssetAmount.fromAsset(asset, {
      amount: balance,
      decimals: decimals,
    });
  }

  async subscribeBalance(
    asset: Asset,
    config: SuiQueryConfig
  ): Promise<Observable<AssetAmount>> {
    const subject = new Subject<AssetAmount>();
    const observable = subject.pipe(shareReplay(1));

    const run = async () => {
      const updateBalance = async () => {
        const balance = await this.getBalance(asset, config);
        subject.next(balance);
      };
      await updateBalance();
      const intervalId = setInterval(() => {}, 3000);
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
