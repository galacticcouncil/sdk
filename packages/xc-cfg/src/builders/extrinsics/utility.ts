import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  ExtrinsicConfigBuilderParams,
} from '@galacticcouncil/xc-core';

const pallet = 'Utility';

/**
 * Splice a nested `batch_all` into the batch composing it.
 *
 * The two execute identically - both are all or nothing - but only the flat
 * one can be read. A submitter decides whether a transaction touches the evm,
 * and so has to be prepended with `EVMAccounts.bind_evm_address`, by looking
 * one level into the batch; an `EVM.call` below that reads as a transaction
 * that never touches the evm. Getting it wrong is not a failed transfer - the
 * calls execute unbound, which leaves the truncated h160 with a non-zero nonce
 * and bars `bind_evm_address` for good.
 *
 * Nesting is what an `evm().call()` produces once anything composes it: it has
 * already batched its own calls.
 */
const flatten = (call: any): any[] =>
  call?.type === pallet && call?.value?.type === 'batch_all'
    ? call.value.value.calls.flatMap(flatten)
    : [call];

const batchAll = (configs: ExtrinsicConfigBuilder[]) => {
  const func = 'batch_all';
  return {
    build: async (params: ExtrinsicConfigBuilderParams) => {
      const cfgs = await Promise.all(configs.map((c) => c.build(params)));
      return new ExtrinsicConfig({
        module: pallet,
        func,
        getTx: (client) => {
          const decoded = cfgs.flatMap((c) =>
            flatten(c.getTx(client).decodedCall)
          );
          return client.getUnsafeApi().tx[pallet][func]({ calls: decoded });
        },
      });
    },
  };
};

export const utility = () => {
  return {
    batchAll,
  };
};
