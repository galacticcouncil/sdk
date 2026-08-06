import { jest } from '@jest/globals';

import { EvmParachain, ExtrinsicConfig } from '@galacticcouncil/xc-core';

import { Binary } from 'polkadot-api';

import { SubstrateEvm } from './SubstrateEvm';
import { SubstrateService } from './SubstrateService';

const ACCOUNT = '7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1';
const SOURCE = '0x82fb02afe02fe5d6c793145a75e6860c4e206682';
const SHIM = '0xd3Dda7c8608Ea251C42c6E0A2A686aDc5e9C0C03';
const TOKEN = '0x0000000000000000000000000000000100000012';

/** Marks a tx so the assembled batch can be read back in order. */
const tagged = (tag: string) => ({
  decodedCall: { tag },
  getEncodedData: async () => Binary.fromHex('0x00'),
});

const api = {
  tx: {
    EVM: {
      call: ({ target }: { target: string }) => tagged('EVM.call:' + target),
    },
    Utility: {
      batch_all: ({ calls }: { calls: { tag: string }[] }) => ({
        ...tagged('Utility.batch_all'),
        calls,
      }),
    },
  },
};

const chain = {
  getDerivatedAddress: async () => SOURCE,
  evmClient: {
    getProvider: () => ({ getGasPrice: async () => 1_000_000_000n }),
  },
} as unknown as EvmParachain;

const swap = new ExtrinsicConfig({
  module: 'Router',
  func: 'buy',
  getTx: () => tagged('Router.buy') as any,
});

const evmCall = (to: string) => ({ to, data: '0x00', gas: 100_000n });

/** Tags of the batched calls, in order. */
const batchOf = async (
  calls: ReturnType<typeof evmCall>[],
  prior?: ExtrinsicConfig
) => {
  const substrateEvm = await SubstrateEvm.create(chain);
  await substrateEvm.buildCall(ACCOUNT, calls, prior);

  const built = batched.at(-1);
  return built?.map((c) => c.tag);
};

let batched: { tag: string }[][] = [];

describe('SubstrateEvm', () => {
  beforeEach(() => {
    batched = [];
    const batchAll = api.tx.Utility.batch_all;
    jest.spyOn(api.tx.Utility, 'batch_all').mockImplementation((args: any) => {
      batched.push(args.calls);
      return batchAll(args);
    });

    jest.spyOn(SubstrateService, 'create').mockResolvedValue({
      client: { getUnsafeApi: () => api },
      isDryRunSupported: () => false,
    } as unknown as SubstrateService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should batch the evm calls alone when there is no prior', async () => {
    const tags = await batchOf([evmCall(TOKEN), evmCall(SHIM)]);

    expect(tags).toEqual(['EVM.call:' + TOKEN, 'EVM.call:' + SHIM]);
  });

  // The prior buys the weth that the EVM.call value is charged in, so a batch
  // that runs it after the transfer funds nothing.
  it('should run the prior ahead of every evm call', async () => {
    const tags = await batchOf([evmCall(TOKEN), evmCall(SHIM)], swap);

    expect(tags).toEqual([
      'Router.buy',
      'EVM.call:' + TOKEN,
      'EVM.call:' + SHIM,
    ]);
  });

  // A lone evm call is normally sent unbatched - adding a prior has to
  // promote it to a batch, or the prior is silently dropped.
  it('should batch a single evm call once it has a prior', async () => {
    const tags = await batchOf([evmCall(SHIM)], swap);

    expect(tags).toEqual(['Router.buy', 'EVM.call:' + SHIM]);
  });

  it('should not batch a single evm call without a prior', async () => {
    const tags = await batchOf([evmCall(SHIM)]);

    expect(tags).toBeUndefined();
  });
});
