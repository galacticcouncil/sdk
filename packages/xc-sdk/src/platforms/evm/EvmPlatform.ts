import {
  addr,
  Abi,
  AnyEvmChain,
  AssetAmount,
  CallType,
  ContractConfig,
  Erc20Client,
  EvmClient,
  EvmParachain,
} from '@galacticcouncil/xc-core';

import { EvmTransferFactory } from './transfer';
import {
  isNativeEthBridge,
  isPrecompile,
  isSnowbridgeV2,
  getSnowbridgeV2TokenAddress,
} from './transfer/utils';
import { EvmCall, EvmDryRunResult } from './types';

import { Gas, SubstrateEvm } from '../substrate/SubstrateEvm';
import { Call, Platform } from '../types';

const { EvmAddr } = addr;

export class EvmPlatform implements Platform<ContractConfig> {
  readonly #chain: AnyEvmChain;
  readonly #client: EvmClient;

  constructor(chain: AnyEvmChain) {
    this.#chain = chain;
    this.#client = chain.evmClient;
  }

  async buildCall(
    account: string,
    amount: bigint,
    _feeBalance: AssetAmount,
    config: ContractConfig
  ): Promise<Call> {
    if (!EvmAddr.isValid(account) && this.#chain instanceof EvmParachain) {
      return this.buildSubstrateEvmCall(account, amount, config);
    }

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

    const tokenAddress =
      config.token ??
      (isSnowbridgeV2(config) ? getSnowbridgeV2TokenAddress(config)! : asset);

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

  /**
   * Build transfer call for a substrate signed origin.
   *
   * Wraps the evm contract call(s) in EVM.call extrinsic(s), batching
   * the erc20 approve when allowance is insufficient (single signature).
   */
  private async buildSubstrateEvmCall(
    account: string,
    amount: bigint,
    config: ContractConfig
  ): Promise<Call> {
    const chain = this.#chain as EvmParachain;
    const contract = EvmTransferFactory.get(this.#client, config);
    const { asset, calldata } = contract;

    const substrateEvm = await SubstrateEvm.create(chain);
    const transferCall = {
      to: config.address,
      data: calldata,
      value: config.value,
      gas: Gas.transfer,
    };

    if (isPrecompile(config) || isNativeEthBridge(config)) {
      return substrateEvm.buildCall(account, [transferCall]);
    }

    const source = await chain.getDerivatedAddress(account);
    const tokenAddress =
      config.token ??
      (isSnowbridgeV2(config) ? getSnowbridgeV2TokenAddress(config)! : asset);

    const erc20 = new Erc20Client(this.#client, tokenAddress);
    const allowance = await erc20.allowance(source, config.address);
    if (allowance >= amount) {
      return substrateEvm.buildCall(account, [transferCall]);
    }

    const approve = erc20.approve(config.address, amount);
    return substrateEvm.buildCall(account, [
      {
        to: tokenAddress,
        data: approve,
        gas: Gas.approve,
      },
      transferCall,
    ]);
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
