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
import { EvmCall } from './types';

import { Platform } from '../types';

export class EvmPlatform implements Platform<ContractConfig, ContractConfig> {
  readonly #client: EvmClient;

  constructor(chain: AnyEvmChain) {
    this.#client = chain.client;
  }

  async calldata(
    account: string,
    amount: bigint,
    _feeBalance: AssetAmount,
    config: ContractConfig
  ): Promise<EvmCall> {
    const { abi, asset, calldata } = EvmTransferFactory.get(
      this.#client,
      config
    );

    const transferCall = {
      abi: JSON.stringify(abi),
      data: calldata as `0x${string}`,
      from: account as `0x${string}`,
      to: config.address as `0x${string}`,
      value: config.value,
      type: CallType.Evm,
    } as EvmCall;

    if (isPrecompile(config) || isNativeEthBridge(config)) {
      return transferCall;
    }

    const erc20 = new Erc20Client(this.#client, asset);
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
      to: asset as `0x${string}`,
      type: CallType.Evm,
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
