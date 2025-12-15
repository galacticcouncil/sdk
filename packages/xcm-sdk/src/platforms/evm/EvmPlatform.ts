import {
  Abi,
  AnyEvmChain,
  Asset,
  AssetAmount,
  CallType,
  ContractConfig,
  Erc20Client,
  EvmClient,
} from '@galacticcouncil/xcm-core';

import {
  distinctUntilChanged,
  finalize,
  shareReplay,
  Observable,
  Subject,
} from 'rxjs';

import { EvmBalanceFactory } from './balance';
import { EvmTransferFactory } from './transfer';
import { isNativeEthBridge, isPrecompile } from './transfer/utils';
import { EvmCall, EvmDryRunResult } from './types';

import { Platform } from '../types';

export class EvmPlatform implements Platform<ContractConfig, ContractConfig> {
  readonly #client: EvmClient;
  readonly #chain: AnyEvmChain;

  constructor(chain: AnyEvmChain) {
    this.#chain = chain;
    this.#client = chain.client;
  }

  async buildCall(
    account: string,
    amount: bigint,
    asset: Asset,
    _feeBalance: AssetAmount,
    config: ContractConfig
  ): Promise<EvmCall> {
    const contract = EvmTransferFactory.get(this.#client, config);
    const { abi, calldata } = contract;
    const transferCall = {
      abi: JSON.stringify(abi),
      data: calldata as `0x${string}`,
      from: account as `0x${string}`,
      to: config.address as `0x${string}`,
      type: CallType.Evm,
      value: config.value,
      dryRun: async () => {
        const { error, logs } = await contract.simulateCall(account);
        const decodedEvents = contract.decodeEvents(logs);
        return {
          call: config.module + '.' + config.func,
          error: error?.shortMessage,
          events: decodedEvents,
        } as EvmDryRunResult;
      },
    } as EvmCall;

    if (isPrecompile(config) || isNativeEthBridge(config)) {
      return transferCall;
    }

    const assetId = this.#chain.getBalanceAssetId(asset).toString();
    const erc20 = new Erc20Client(this.#client, assetId);
    const allowance = await erc20.allowance(account, config.address);
    if (allowance >= amount) {
      return transferCall;
    }

    const approve = erc20.approve(config.address, amount);
    return {
      abi: JSON.stringify(Abi.Erc20),
      allowance: allowance,
      data: approve as `0x${string}`,
      from: account as `0x${string}`,
      to: assetId as `0x${string}`,
      type: CallType.Evm,
      dryRun: () => {},
    } as EvmCall;
  }

  async estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: ContractConfig
  ): Promise<AssetAmount> {
    const contract = EvmTransferFactory.get(this.#client, config);
    const fee = await contract.estimateFee(account, amount);
    return feeBalance.copyWith({
      amount: fee,
    });
  }

  async getBalance(asset: Asset, config: ContractConfig): Promise<AssetAmount> {
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

  async subscribeBalance(
    asset: Asset,
    config: ContractConfig
  ): Promise<Observable<AssetAmount>> {
    const subject = new Subject<AssetAmount>();
    const observable = subject.pipe(shareReplay(1));
    const provider = this.#client.getProvider();

    const run = async () => {
      const updateBalance = async () => {
        const balance = await this.getBalance(asset, config);
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
