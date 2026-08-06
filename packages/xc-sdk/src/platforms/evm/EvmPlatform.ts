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

import { type Abi as TAbi, encodeFunctionData } from 'viem';

import { EvmTransferFactory } from './transfer';
import {
  isNativeEthBridge,
  isPrecompile,
  isSnowbridgeV2,
  getSnowbridgeV2TokenAddress,
} from './transfer/utils';
import { EvmCall, EvmDryRunResult } from './types';

import { EvmCallData, Gas, SubstrateEvm } from '../substrate/SubstrateEvm';
import { Call, Platform } from '../types';

const { EvmAddr } = addr;

/** WETH.deposit() calldata, wraps the attached native value. */
const WETH_DEPOSIT = encodeFunctionData({
  abi: Abi.Weth,
  functionName: 'deposit',
});

/**
 * Evm gas ceilings for the steps a fee estimate can't measure - the transfer
 * reverts while a prerequisite is still pending, and the prerequisites don't
 * exist on chain yet. Realistic upper bounds (weth deposit ~28k, erc20
 * approve ~46k, ntt transfer ~300k), unlike the fatter {@link Gas} ceilings
 * an EVM.call has to declare upfront. Overstating only shrinks the sendable
 * max, gas being metered on chain.
 */
const FeeGas = {
  deposit: 60_000n,
  approve: 70_000n,
  transfer: 500_000n,
} as const;

/** Prerequisite step, signed standalone (evm) or batched (substrate). */
type Prerequisite = EvmCallData & {
  abi: TAbi;
  /** Gas to charge for in a fee estimate, {@link EvmCallData.gas} being the EVM.call ceiling. */
  feeGas: bigint;
  allowance?: bigint;
};

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
    feeBalance: AssetAmount,
    config: ContractConfig
  ): Promise<Call> {
    const [call] = await this.buildCalls(account, amount, feeBalance, config);
    return call;
  }

  /**
   * Build the ordered call sequence of a transfer.
   *
   * All but the last call are prerequisites the sender has to sign first,
   * each becoming unnecessary once executed - [wrap?, approve?, transfer].
   * A substrate signed origin batches them into a single call.
   */
  async buildCalls(
    account: string,
    amount: bigint,
    _feeBalance: AssetAmount,
    config: ContractConfig
  ): Promise<Call[]> {
    if (!EvmAddr.isValid(account) && this.#chain instanceof EvmParachain) {
      return [await this.buildSubstrateEvmCall(account, amount, config)];
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

    // Runs on the same origin right after the transfer, so it needs no
    // prerequisites of its own - it spends native value, never the token.
    const followCall = config.follow
      ? ({
          abi: JSON.stringify(config.follow.abi),
          data: EvmTransferFactory.get(this.#client, config.follow)
            .calldata as `0x${string}`,
          from: account as `0x${string}`,
          to: config.follow.address as `0x${string}`,
          type: CallType.Evm,
          value: config.follow.value,
          dryRun: () => {},
        } as EvmCall)
      : undefined;
    const trailing = followCall ? [transferCall, followCall] : [transferCall];

    if (isPrecompile(config) || isNativeEthBridge(config)) {
      return trailing;
    }

    const prerequisites = await this.getPrerequisites(
      account,
      amount,
      config,
      asset
    );

    const calls = prerequisites.map(
      (p) =>
        ({
          abi: JSON.stringify(p.abi),
          allowance: p.allowance,
          data: p.data as `0x${string}`,
          from: account as `0x${string}`,
          to: p.to as `0x${string}`,
          type: CallType.Evm,
          value: p.value,
          dryRun: () => {},
        }) as EvmCall
    );

    return [...calls, ...trailing];
  }

  /**
   * Account dependent steps required before the transfer call can execute.
   *
   * Ordered - a native gas source is wrapped into the erc20 the contract
   * pulls, which the contract is then approved to spend.
   */
  private async getPrerequisites(
    owner: string,
    amount: bigint,
    config: ContractConfig,
    asset: string
  ): Promise<Prerequisite[]> {
    const tokenAddress =
      config.token ??
      (isSnowbridgeV2(config) ? getSnowbridgeV2TokenAddress(config)! : asset);

    const erc20 = new Erc20Client(this.#client, tokenAddress);
    const [wrapped, allowance] = await Promise.all([
      config.wrapNative ? erc20.balanceOf(owner) : 0n,
      erc20.allowance(owner, config.address),
    ]);

    const prerequisites: Prerequisite[] = [];

    if (config.wrapNative && wrapped < amount) {
      prerequisites.push({
        abi: Abi.Weth,
        to: tokenAddress,
        data: WETH_DEPOSIT,
        value: amount - wrapped,
        gas: Gas.deposit,
        feeGas: FeeGas.deposit,
      });
    }

    if (allowance < amount) {
      prerequisites.push({
        abi: Abi.Erc20,
        allowance: allowance,
        to: tokenAddress,
        data: erc20.approve(config.address, amount),
        gas: Gas.approve,
        feeGas: FeeGas.approve,
      });
    }

    return prerequisites;
  }

  /**
   * Build transfer call for a substrate signed origin.
   *
   * Wraps the evm contract call(s) in EVM.call extrinsic(s), batching the
   * native wrap & erc20 approve when required (single signature).
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

    const trailing = config.follow
      ? [
          transferCall,
          {
            to: config.follow.address,
            data: EvmTransferFactory.get(this.#client, config.follow).calldata,
            value: config.follow.value,
            gas: Gas.transfer,
          },
        ]
      : [transferCall];

    if (isPrecompile(config) || isNativeEthBridge(config)) {
      return substrateEvm.buildCall(account, trailing, config.prior);
    }

    const source = await chain.getDerivatedAddress(account);
    const prerequisites = await this.getPrerequisites(
      source,
      amount,
      config,
      asset
    );

    return substrateEvm.buildCall(
      account,
      [...prerequisites, ...trailing],
      config.prior
    );
  }

  /**
   * Fee of a transfer, in the route's fee asset.
   *
   * Gas of the transfer call, unless the amount is drawn from the very
   * balance that pays for the transfer ({@link ContractConfig.wrapNative}).
   * Then the call value and the gas of every prerequisite are part of it
   * too - max being derived as balance - fee, an incomplete fee leaves
   * nothing to wrap, deliver & execute with.
   *
   * For an erc20 source the value stays out: it is either reported as the
   * route's destination fee (snowbridge) or drawn from a balance the amount
   * doesn't compete for. Its prerequisites are charged for all the same -
   * the approve is a transaction the sender signs and pays gas on.
   *
   * Which configs have prerequisites is decided exactly as {@link buildCalls}
   * decides it. Estimating the transfer alone instead left an erc20 source
   * reporting no fee at all: the transfer reverts until the approve lands,
   * and an unmeasurable fee falls back to zero.
   */
  async estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: ContractConfig
  ): Promise<AssetAmount> {
    const contract = EvmTransferFactory.get(this.#client, config);

    // Nothing is being sent yet, so there is nothing to charge for.
    if (amount === 0n) {
      return feeBalance.copyWith({ amount: 0n });
    }

    if (isPrecompile(config) || isNativeEthBridge(config)) {
      const fee = await contract.estimateFee(account, amount);
      return feeBalance.copyWith({
        amount: fee,
      });
    }

    const [prerequisites, gasPrice] = await Promise.all([
      this.getPrerequisites(account, amount, config, contract.asset),
      contract.getGasPrice(),
    ]);

    // The transfer reverts until its prerequisites are executed, leaving
    // its gas unmeasurable - the ceiling stands in. A revert with none
    // pending is a genuine one, surfaced by the call's dry run.
    let transferGas: bigint = FeeGas.transfer;
    if (prerequisites.length === 0) {
      try {
        transferGas = await contract.estimateGas(account);
      } catch {}
    }

    const gas = prerequisites.reduce<bigint>(
      (total, p) => total + p.feeGas,
      transferGas
    );

    return feeBalance.copyWith({
      amount: gas * gasPrice + (config.wrapNative ? (config.value ?? 0n) : 0n),
    });
  }
}
