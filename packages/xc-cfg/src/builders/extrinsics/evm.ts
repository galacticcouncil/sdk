import {
  ContractConfigBuilder,
  EvmCallData,
  EvmParachain,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Gas,
  getEvmPrerequisites,
} from '@galacticcouncil/xc-core';

import { Binary } from 'polkadot-api';

const pallet = 'EVM';

const U64_MASK = (1n << 64n) - 1n;

/** U256 as 4 little-endian u64 limbs (papi wire format) */
const toU256 = (value: bigint): bigint[] => [
  value & U64_MASK,
  (value >> 64n) & U64_MASK,
  (value >> 128n) & U64_MASK,
  (value >> 192n) & U64_MASK,
];

/**
 * Evm contract calls executed from a substrate signed origin.
 *
 * The substrate counterpart of handing the {@link ContractConfigBuilder} to
 * the evm platform - each call is wrapped in `EVM.call` and the sequence
 * (account prerequisites first, then the contract calls) is batched into one
 * signature. Makes the whole transfer a single `ExtrinsicConfig`, so a fee
 * swap composes with it through `Utility.batch_all` like any other extrinsic
 * instead of riding along on the contract config.
 *
 * `EVM.call` runs under `EnsureAddressTruncated`: the evm source must be the
 * signer's truncated H160 and the account must be bound on chain
 * (`EVMAccounts`), otherwise gas & token balances resolve to the unrelated
 * `ETH\0` phantom account. An h160 signer has no substrate origin to wrap
 * into and takes the route's `contract` config directly.
 */
const call = (contract: ContractConfigBuilder): ExtrinsicConfigBuilder => ({
  build: async (params) => {
    const chain = params.source.chain as EvmParachain;
    const evmClient = chain.evmClient;

    const configs = await contract.build(params);

    const [source, gasPrice] = await Promise.all([
      chain.getDerivatedAddress(params.sender),
      evmClient.getProvider().getGasPrice(),
    ]);
    const maxFeePerGas = gasPrice + gasPrice / 10n;

    // Only the first call spends the token - the ones after it run on the
    // same origin and pay in native gas.
    const prerequisites = await getEvmPrerequisites(
      evmClient,
      source,
      params.amount,
      configs[0]
    );

    const calls: EvmCallData[] = [
      ...prerequisites,
      ...configs.map((c) => ({
        to: c.address,
        data: c.encodeFunctionData(),
        value: c.value,
        gas: Gas.transfer,
      })),
    ];

    const batched = calls.length > 1;
    return new ExtrinsicConfig({
      module: batched ? 'Utility' : pallet,
      func: batched ? 'batch_all' : 'call',
      getTx: (client) => {
        const api = client.getUnsafeApi();
        const txs = calls.map((c) =>
          api.tx[pallet].call({
            source: source,
            target: c.to,
            input: Binary.fromHex(c.data),
            value: toU256(c.value ?? 0n),
            gas_limit: c.gas,
            max_fee_per_gas: toU256(maxFeePerGas),
            max_priority_fee_per_gas: undefined,
            nonce: undefined,
            access_list: [],
            // Required since the eip-7702 runtime upgrade - omitting it fails
            // the papi compatibility check, not just encoding.
            authorization_list: [],
          })
        );

        return batched
          ? api.tx.Utility.batch_all({ calls: txs.map((t) => t.decodedCall) })
          : txs[0];
      },
    });
  },
});

export const evm = () => {
  return {
    call,
  };
};
