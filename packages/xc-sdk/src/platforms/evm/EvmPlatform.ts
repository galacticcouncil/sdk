import {
  addr,
  AnyEvmChain,
  AssetAmount,
  CallType,
  ContractConfig,
  EvmClient,
  FeeGas,
  getEvmPrerequisites,
  isNativeEthBridge,
  isPrecompile,
} from '@galacticcouncil/xc-core';

import { EvmTransferFactory } from './transfer';
import { EvmCall, EvmDryRunResult } from './types';

import { Call, Platform } from '../types';

const { EvmAddr } = addr;

export class EvmPlatform implements Platform<ContractConfig> {
  readonly #client: EvmClient;

  constructor(chain: AnyEvmChain) {
    this.#client = chain.evmClient;
  }

  /**
   * Build the ordered call sequence of a transfer.
   *
   * The route's calls, preceded by the prerequisites the sender has to sign
   * first - [wrap?, approve?, ...calls]. Each prerequisite becomes
   * unnecessary once executed, so re-building after a signed step yields a
   * shorter sequence.
   *
   * Every call is its own signature. A substrate signed origin batches the
   * same steps into one, and reaches them through the route's `extrinsic`
   * config rather than here.
   */
  async buildCalls(
    account: string,
    amount: bigint,
    _feeBalance: AssetAmount,
    configs: ContractConfig[]
  ): Promise<Call[]> {
    if (!EvmAddr.isValid(account)) {
      throw new Error(
        'Contract config needs an h160 origin, got ' +
          account +
          '. A substrate origin has to reach the evm calls through the route ' +
          'extrinsic config.'
      );
    }

    const [spender] = configs;
    const prerequisites = await getEvmPrerequisites(
      this.#client,
      account,
      amount,
      spender
    );

    const prerequisiteCalls = prerequisites.map(
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

    // Only the token spender is simulated. The calls after it run on the same
    // origin and only make sense once it has executed, so there is nothing to
    // dry run them against.
    const calls = configs.map((config, i) =>
      i === 0
        ? this.buildTransferCall(account, config)
        : this.buildFollowCall(account, config)
    );

    return [...prerequisiteCalls, ...calls];
  }

  private buildTransferCall(account: string, config: ContractConfig): EvmCall {
    const contract = EvmTransferFactory.get(this.#client, config);
    return {
      abi: JSON.stringify(contract.abi),
      data: contract.calldata as `0x${string}`,
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
  }

  private buildFollowCall(account: string, config: ContractConfig): EvmCall {
    return {
      abi: JSON.stringify(config.abi),
      data: EvmTransferFactory.get(this.#client, config)
        .calldata as `0x${string}`,
      from: account as `0x${string}`,
      to: config.address as `0x${string}`,
      type: CallType.Evm,
      value: config.value,
      dryRun: () => {},
    } as EvmCall;
  }

  /**
   * Fee of a transfer, in the route's fee asset.
   *
   * Gas of the transfer calls, unless the amount is drawn from the very
   * balance that pays for the transfer ({@link ContractConfig.wrapNative}).
   * Then the call value and the gas of every prerequisite are part of it
   * too - max being derived as balance - fee, an incomplete fee leaves
   * nothing to wrap, deliver & execute with.
   *
   * For an erc20 source the value stays out: it is either reported as the
   * route's destination fee (snowbridge, the ntt executor cost) or drawn from
   * a balance the amount doesn't compete for. Its prerequisites are charged
   * for all the same - the approve is a transaction the sender signs and pays
   * gas on.
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
    configs: ContractConfig[]
  ): Promise<AssetAmount> {
    const [spender] = configs;
    const contract = EvmTransferFactory.get(this.#client, spender);

    // Nothing is being sent yet, so there is nothing to charge for.
    if (amount === 0n) {
      return feeBalance.copyWith({ amount: 0n });
    }

    if (isPrecompile(spender) || isNativeEthBridge(spender)) {
      const fee = await contract.estimateFee(account, amount);
      return feeBalance.copyWith({
        amount: fee,
      });
    }

    const [prerequisites, gasPrice] = await Promise.all([
      getEvmPrerequisites(this.#client, account, amount, spender),
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
      amount:
        gas * gasPrice + (spender.wrapNative ? (spender.value ?? 0n) : 0n),
    });
  }
}
