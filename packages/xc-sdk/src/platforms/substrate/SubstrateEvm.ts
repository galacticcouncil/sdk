import { CallType, EvmParachain } from '@galacticcouncil/xc-core';

import { Binary } from 'polkadot-api';

import { SubstrateService } from './SubstrateService';
import { getErrorFromDryRun } from './utils';
import { SubstrateCall, SubstrateDryRunResult } from './types';

const U64_MASK = (1n << 64n) - 1n;

// Conservative gas ceilings, unused gas is refunded by the evm runner.
export const Gas = {
  approve: 200_000n,
  deposit: 200_000n,
  transfer: 1_200_000n,
  redeem: 2_000_000n,
  queued: 600_000n,
} as const;

/** U256 as 4 little-endian u64 limbs (papi wire format) */
const toU256 = (value: bigint): bigint[] => [
  value & U64_MASK,
  (value >> 64n) & U64_MASK,
  (value >> 128n) & U64_MASK,
  (value >> 192n) & U64_MASK,
];

export type EvmCallData = {
  to: string;
  data: string;
  value?: bigint;
  gas: bigint;
};

/**
 * EVM.call extrinsic wrapper.
 *
 * Executes evm contract calls from a substrate signed origin. The evm
 * source must be the signer truncated H160 (EnsureAddressTruncated) and
 * the account has to be bound on chain (EVMAccounts) so gas & token
 * balances resolve to the real account.
 */
export class SubstrateEvm {
  readonly #substrate: SubstrateService;
  readonly #chain: EvmParachain;

  private constructor(substrate: SubstrateService, chain: EvmParachain) {
    this.#substrate = substrate;
    this.#chain = chain;
  }

  static async create(chain: EvmParachain): Promise<SubstrateEvm> {
    const substrate = await SubstrateService.create(chain);
    return new SubstrateEvm(substrate, chain);
  }

  async buildCall(from: string, calls: EvmCallData[]): Promise<SubstrateCall> {
    const source = await this.#chain.getDerivatedAddress(from);
    const gasPrice = await this.#chain.evmClient.getProvider().getGasPrice();
    const maxFeePerGas = gasPrice + gasPrice / 10n;

    const api = this.#substrate.client.getUnsafeApi();
    const txs = calls.map((call) =>
      api.tx.EVM.call({
        source: source,
        target: call.to,
        input: Binary.fromHex(call.data),
        value: toU256(call.value ?? 0n),
        gas_limit: call.gas,
        max_fee_per_gas: toU256(maxFeePerGas),
        max_priority_fee_per_gas: undefined,
        nonce: undefined,
        access_list: [],
      })
    );

    const tx =
      txs.length === 1
        ? txs[0]
        : api.tx.Utility.batch_all({
            calls: txs.map((t) => t.decodedCall),
          });

    const callName = calls.length === 1 ? 'EVM.call' : 'Utility.batch_all';
    const callData = await tx.getEncodedData();

    return {
      from: from,
      data: Binary.toHex(callData),
      type: CallType.Substrate,
      txOptions: undefined,
      dryRun: this.#substrate.isDryRunSupported()
        ? async () => {
            try {
              const dryRunResult = await this.#substrate.dryRun(from, tx);
              const error =
                dryRunResult.execution_result &&
                dryRunResult.execution_result.success
                  ? undefined
                  : getErrorFromDryRun(dryRunResult.execution_result);
              return {
                call: callName,
                error: error,
                events: dryRunResult.emitted_events || [],
                xcm: dryRunResult.forwarded_xcms || [],
              } as SubstrateDryRunResult;
            } catch (e) {
              return {
                call: callName,
                error: e instanceof Error ? e.message : 'unknown',
              } as SubstrateDryRunResult;
            }
          }
        : () => {},
    } as SubstrateCall;
  }
}
