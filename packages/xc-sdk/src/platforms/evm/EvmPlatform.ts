import {
  Abi,
  AnyEvmChain,
  AssetAmount,
  CallType,
  ContractConfig,
  Erc20Client,
  EvmClient,
} from '@galacticcouncil/xc-core';

import { EvmTransferFactory } from './transfer';
import {
  isNativeEthBridge,
  isPrecompile,
  isSnowbridgeV2,
  getSnowbridgeV2TokenAddress,
} from './transfer/utils';
import { EvmCall, EvmDryRunResult } from './types';

import { Platform } from '../types';

export class EvmPlatform implements Platform<ContractConfig> {
  readonly #client: EvmClient;

  constructor(chain: AnyEvmChain) {
    this.#client = chain.evmClient;
  }

  async buildCall(
    account: string,
    amount: bigint,
    _feeBalance: AssetAmount,
    config: ContractConfig
  ): Promise<EvmCall> {
    const contract = EvmTransferFactory.get(this.#client, config);
    const { abi, asset, calldata } = contract;
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

    const tokenAddress = isSnowbridgeV2(config)
      ? getSnowbridgeV2TokenAddress(config)!
      : asset;

    const erc20 = new Erc20Client(this.#client, tokenAddress);
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
      to: tokenAddress as `0x${string}`,
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
}
