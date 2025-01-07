import {
  Asset,
  AssetAmount,
  CallType,
  ProgramConfig,
  SolanaChain,
  SolanaQueryConfig,
} from '@galacticcouncil/xcm-core';

import { Connection, PublicKey } from '@solana/web3.js';

import { Buffer } from 'buffer';
import {
  distinctUntilChanged,
  finalize,
  shareReplay,
  Observable,
  Subject,
} from 'rxjs';

import { SolanaBalanceFactory } from './balance';
import { SolanaTransferFactory } from './transfer';
import { SolanaCall } from './types';

import { Platform } from '../types';
import { ixToHuman } from './utils';

export class SolanaPlatform
  implements Platform<ProgramConfig, SolanaQueryConfig>
{
  readonly #connection: Connection;

  constructor(chain: SolanaChain) {
    this.#connection = chain.connection;
  }

  async calldata(
    account: string,
    _amount: bigint,
    config: ProgramConfig
  ): Promise<SolanaCall> {
    const transfer = SolanaTransferFactory.get(this.#connection, config);
    const mssgV0 = await transfer.getPriorityMessage(account);
    const mssgArray = mssgV0.serialize();
    const mssgHex = Buffer.from(mssgArray).toString('hex');
    return {
      from: account,
      data: mssgHex,
      ix: ixToHuman(config.instructions),
      signers: config.signers,
      type: CallType.Solana,
    } as SolanaCall;
  }

  async estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: ProgramConfig
  ): Promise<AssetAmount> {
    const transfer = SolanaTransferFactory.get(this.#connection, config);
    const fee = await transfer.estimateFee(account, amount);
    return feeBalance.copyWith({
      amount: fee,
    });
  }

  async getBalance(
    asset: Asset,
    config: SolanaQueryConfig
  ): Promise<AssetAmount> {
    const query = SolanaBalanceFactory.get(this.#connection, config);
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
    config: SolanaQueryConfig
  ): Promise<Observable<AssetAmount>> {
    const subject = new Subject<AssetAmount>();
    const observable = subject.pipe(shareReplay(1));

    const run = async () => {
      const updateBalance = async () => {
        const balance = await this.getBalance(asset, config);
        subject.next(balance);
      };
      await updateBalance();
      const sender = new PublicKey(config.address);
      const id = this.#connection.onAccountChange(sender, () =>
        updateBalance()
      );
      return () => {
        this.#connection.removeAccountChangeListener(id);
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
