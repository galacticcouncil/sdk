import {
  AssetAmount,
  FunctionCallConfig,
  NEAR_STORAGE_BYTE_COST,
  NearChain,
  NearClient,
  NearGas,
} from '@galacticcouncil/xc-core';

import { NearCall, NearFunctionCall } from './types';
import { toNearCall } from './utils';

import { Platform } from '../types';

type StorageBalance = { total: string; available: string };

/** One transaction to one receiver, and the native near it wraps. */
interface NearTx {
  receiverId: string;
  actions: NearFunctionCall[];
  /** Wrapped for the transfer - the amount itself, not a cost. */
  wrapped: bigint;
}

export class NearPlatform implements Platform<FunctionCallConfig> {
  readonly #client: NearClient;

  constructor(chain: NearChain) {
    this.#client = chain.client;
  }

  /**
   * Build the transactions of a transfer.
   *
   * - Consecutive configs on the same receiver share one transaction, whose
   *   actions run in order and atomically
   * - A native source is wrapped in that transaction, ahead of the call
   */
  async buildCalls(
    account: string,
    amount: bigint,
    _feeBalance: AssetAmount,
    configs: FunctionCallConfig[]
  ): Promise<NearCall[]> {
    const txs = await this.getTransactions(account, amount, configs);
    return txs.map(({ receiverId, actions }) =>
      toNearCall(account, receiverId, actions)
    );
  }

  /**
   * Fee of a transfer, in native near.
   *
   * - What the sender has to hold for it to be accepted: prepaid gas at the
   *   current price, attached deposits and its own storage stake
   * - Unused gas is refunded, so the settled cost is lower
   * - Near wrapped for a native source is the amount, not a cost
   */
  async estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    configs: FunctionCallConfig[]
  ): Promise<AssetAmount> {
    const [txs, gasPrice, state] = await Promise.all([
      this.getTransactions(account, amount, configs),
      this.#client.getGasPrice(),
      this.#client.viewAccount(account),
    ]);

    const actions = txs.flatMap((tx) => tx.actions);
    const gas = actions.reduce((total, a) => total + a.gas, 0n);
    const deposits = actions.reduce((total, a) => total + a.deposit, 0n);
    const wrapped = txs.reduce((total, tx) => total + tx.wrapped, 0n);
    const stake = state
      ? BigInt(state.storage_usage) * NEAR_STORAGE_BYTE_COST
      : 0n;

    return feeBalance.copyWith({
      amount: gas * gasPrice + deposits - wrapped + stake,
    });
  }

  private async getTransactions(
    account: string,
    amount: bigint,
    configs: FunctionCallConfig[]
  ): Promise<NearTx[]> {
    const txs: NearTx[] = [];
    for (const config of configs) {
      const { actions, wrapped } = await this.getWrap(account, amount, config);
      actions.push({
        methodName: config.func,
        args: config.args,
        gas: config.gas,
        deposit: config.deposit,
      });

      const last = txs[txs.length - 1];
      if (last && last.receiverId === config.receiverId) {
        last.actions.push(...actions);
        last.wrapped += wrapped;
      } else {
        txs.push({ receiverId: config.receiverId, actions, wrapped });
      }
    }
    return txs;
  }

  /**
   * Wrap ahead of a call spending native near.
   *
   * - Registers the sender on the token first if it never was, paying the
   *   token's own minimum
   * - Wraps only the shortfall - a token balance already held is spent first
   *
   * @param account - sender
   * @param amount - transfer amount
   * @param config - call on the wrap token
   */
  private async getWrap(
    account: string,
    amount: bigint,
    config: FunctionCallConfig
  ): Promise<{ actions: NearFunctionCall[]; wrapped: bigint }> {
    if (!config.wrapNative) {
      return { actions: [], wrapped: 0n };
    }

    const token = config.receiverId;
    const [registration, balance] = await Promise.all([
      this.#client.view<StorageBalance | null>(token, 'storage_balance_of', {
        account_id: account,
      }),
      this.#client.view<string>(token, 'ft_balance_of', {
        account_id: account,
      }),
    ]);

    const actions: NearFunctionCall[] = [];
    if (!registration) {
      const { min } = await this.#client.view<{ min: string }>(
        token,
        'storage_balance_bounds'
      );
      actions.push({
        methodName: 'storage_deposit',
        args: { registration_only: true },
        gas: NearGas.wrap,
        deposit: BigInt(min),
      });
    }

    const shortfall = amount - BigInt(balance);
    if (shortfall <= 0n) {
      return { actions, wrapped: 0n };
    }

    actions.push({
      methodName: 'near_deposit',
      args: {},
      gas: NearGas.wrap,
      deposit: shortfall,
    });
    return { actions, wrapped: shortfall };
  }
}
