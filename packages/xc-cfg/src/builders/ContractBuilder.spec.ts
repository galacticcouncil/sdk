import {
  ContractConfig,
  ContractConfigBuilder,
  ContractConfigBuilderParams,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
} from '@galacticcouncil/xc-core';

import { ContractDecorator } from './ContractBuilder';

const contractBuilder: ContractConfigBuilder = {
  build: async () =>
    new ContractConfig({
      abi: [],
      address: '0xshim',
      args: [1n],
      func: 'transfer',
      module: 'NttManagerWithExecutor',
      token: '0xtoken',
      value: 100n,
    }),
};

const swapBuilder: ExtrinsicConfigBuilder = {
  build: async () =>
    new ExtrinsicConfig({
      func: 'buy',
      module: 'Router',
      getTx: () => ({}) as any,
    }),
};

const params = {} as ContractConfigBuilderParams;

describe('ContractDecorator', () => {
  it('should attach the extrinsic when the predicate passes', async () => {
    const config = await ContractDecorator(() => true, swapBuilder)
      .prior(contractBuilder)
      .build(params);

    expect(config.prior).toBeDefined();
    expect(config.prior?.module).toBe('Router');
    expect(config.prior?.func).toBe('buy');
  });

  it('should leave the config alone when the predicate fails', async () => {
    const config = await ContractDecorator(() => false, swapBuilder)
      .prior(contractBuilder)
      .build(params);

    expect(config.prior).toBeUndefined();
  });

  // The decorator rebuilds the config to attach `prior`, so every field the
  // platform reads off it has to survive the copy - a dropped `value` or
  // `token` silently underfunds the call or points the allowance at nothing.
  it('should preserve the decorated config', async () => {
    const undecorated = await contractBuilder.build(params);
    const decorated = await ContractDecorator(() => true, swapBuilder)
      .prior(contractBuilder)
      .build(params);

    expect(decorated).toMatchObject({
      abi: undecorated.abi,
      address: undecorated.address,
      args: undecorated.args,
      func: undecorated.func,
      module: undecorated.module,
      token: undecorated.token,
      type: undecorated.type,
      value: undecorated.value,
    });
  });

  it('should not build the extrinsic when the predicate fails', async () => {
    let built = 0;
    const counting: ExtrinsicConfigBuilder = {
      build: async (p) => {
        built++;
        return swapBuilder.build(p);
      },
    };

    await ContractDecorator(() => false, counting)
      .prior(contractBuilder)
      .build(params);

    expect(built).toBe(0);
  });
});
