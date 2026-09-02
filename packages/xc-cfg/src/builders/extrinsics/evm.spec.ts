import {
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  ExtrinsicConfigBuilderParams,
} from '@galacticcouncil/xc-core';

import { Binary } from 'polkadot-api';

import { evm } from './evm';
import { ExtrinsicDecorator } from '../ExtrinsicBuilder';

const SENDER = '7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1';
const SOURCE = '0x82fb02afe02fe5d6c793145a75e6860c4e206682';
const MANAGER = '0x1111111111111111111111111111111111111111';
const EXECUTOR = '0x9999999999999999999999999999999999999999';
const TOKEN = '0x0000000000000000000000000000000100000012';

const RECIPIENT_32 =
  '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045';

const AMOUNT = 1_000_000n;
const APPROVE = '0x095ea7b3';

/**
 * Papi shaped decoded calls - what a submitter reads to decide whether the
 * transaction touches the evm, so the mock carries the same `{ type, value }`
 * envelope the runtime does.
 */
const api = {
  tx: {
    EVM: {
      call: ({ source, target, input }: any) => ({
        decodedCall: {
          type: 'EVM',
          value: {
            type: 'call',
            value: { source, target, input: Binary.toHex(input) },
          },
        },
      }),
    },
    Router: {
      buy: () => ({
        decodedCall: { type: 'Router', value: { type: 'buy', value: {} } },
      }),
    },
    Utility: {
      batch_all: ({ calls }: { calls: any[] }) => ({
        decodedCall: {
          type: 'Utility',
          value: { type: 'batch_all', value: { calls } },
        },
      }),
    },
  },
};

const client = { getUnsafeApi: () => api } as any;

/** Evm calls read back by target, anything else by pallet.call. */
const label = (call: any): string =>
  call.type === 'EVM'
    ? call.value.value.target
    : call.type + '.' + call.value.type;

const read = (config: ExtrinsicConfig) => {
  const { decodedCall } = config.getTx(client) as any;
  const calls =
    decodedCall.type === 'Utility' && decodedCall.value.type === 'batch_all'
      ? decodedCall.value.value.calls
      : [decodedCall];
  return {
    module: config.module,
    func: config.func,
    targets: calls.map(label) as string[],
    calls,
  };
};

const params = (allowance: bigint): ExtrinsicConfigBuilderParams =>
  ({
    amount: AMOUNT,
    sender: SENDER,
    source: {
      chain: {
        getDerivatedAddress: async () => SOURCE,
        evmClient: {
          getProvider: () => ({
            getGasPrice: async () => 1_000_000_000n,
            readContract: async ({
              functionName,
            }: {
              functionName: string;
            }) => {
              if (functionName === 'allowance') return allowance;
              if (functionName === 'balanceOf') return 0n;
              throw new Error('Unexpected read: ' + functionName);
            },
          }),
        },
      },
    },
  }) as unknown as ExtrinsicConfigBuilderParams;

const transfer = new ContractConfig({
  abi: Abi.NttManager,
  address: MANAGER,
  args: [AMOUNT, 73, RECIPIENT_32],
  token: TOKEN,
  value: 100n,
  func: 'transfer',
  module: 'NttManager',
});

const request = new ContractConfig({
  abi: Abi.Executor,
  address: EXECUTOR,
  args: [73, RECIPIENT_32, SOURCE, '0xdead', '0x45524e31', '0x01'],
  value: 5n,
  func: 'requestExecution',
  module: 'Executor',
});

const contract = (...configs: ContractConfig[]): ContractConfigBuilder => ({
  build: async () => configs,
});

/** Destination fee swap, the extrinsic the decorator batches ahead. */
const swap: ExtrinsicConfigBuilder = {
  build: async () =>
    new ExtrinsicConfig({
      module: 'Router',
      func: 'buy',
      getTx: (c) => c.getUnsafeApi().tx.Router.buy() as any,
    }),
};

const callsOf = async (allowance: bigint, ...configs: ContractConfig[]) =>
  read(
    await evm()
      .call(contract(...configs))
      .build(params(allowance))
  );

describe('evm().call()', () => {
  it('should wrap a lone call without batching it', async () => {
    const { module, func, targets } = await callsOf(AMOUNT, transfer);

    expect(module).toBe('EVM');
    expect(func).toBe('call');
    expect(targets).toEqual([MANAGER]);
  });

  // The builder's calls are one atomic unit - batching keeps them on a single
  // signature, which is the whole reason a substrate origin takes this path.
  it('should batch the calls in the order the builder returned them', async () => {
    const { module, func, targets } = await callsOf(AMOUNT, transfer, request);

    expect(module).toBe('Utility');
    expect(func).toBe('batch_all');
    expect(targets).toEqual([MANAGER, EXECUTOR]);
  });

  // The manager pulls the erc20 in the same batch, so an approve landing after
  // it funds nothing.
  it('should lead with the approve when the allowance is short', async () => {
    const { targets } = await callsOf(0n, transfer);

    expect(targets).toEqual([TOKEN, MANAGER]);
  });

  // Only the first config spends the token. Deriving prerequisites from the
  // rest would approve a contract that never pulls anything.
  it('should derive prerequisites from the first config only', async () => {
    const { targets } = await callsOf(0n, transfer, request);

    expect(targets).toEqual([TOKEN, MANAGER, EXECUTOR]);
  });

  // EVM.call runs under EnsureAddressTruncated - a source that is not the
  // signer's truncated h160 resolves gas & token balances to a phantom
  // account.
  it('should keep the derived h160 as the evm source', async () => {
    const { calls } = await callsOf(0n, transfer, request);

    expect(calls.map((c: any) => c.value.value.source)).toEqual([
      SOURCE,
      SOURCE,
      SOURCE,
    ]);
  });

  // The shim this path replaces approves type(uint256).max, which hydration's
  // erc20 precompile rejects - its balances being u128.
  it('should approve the exact amount, not an unbounded allowance', async () => {
    const { calls } = await callsOf(0n, transfer);

    const input = calls[0].value.value.input as string;
    expect(input.startsWith(APPROVE)).toBe(true);
    expect(input.endsWith(AMOUNT.toString(16).padStart(64, '0'))).toBe(true);
  });

  // A batch nested in a batch executes the same but hides its evm calls from
  // anything reading one level down - which is how a submitter decides whether
  // to prepend `EVMAccounts.bind_evm_address`, and a sender that makes an evm
  // call while unbound can never be bound afterwards.
  it('should stay flat when a fee swap is batched ahead of it', async () => {
    const config = await ExtrinsicDecorator(() => true, swap)
      .prior(evm().call(contract(transfer, request)))
      .build(params(0n));

    const { targets } = read(config);
    expect(targets).toEqual(['Router.buy', TOKEN, MANAGER, EXECUTOR]);
  });

  it('should batch nothing ahead when the swap is off', async () => {
    const config = await ExtrinsicDecorator(() => false, swap)
      .prior(evm().call(contract(transfer, request)))
      .build(params(0n));

    const { targets } = read(config);
    expect(targets).toEqual([TOKEN, MANAGER, EXECUTOR]);
  });
});
