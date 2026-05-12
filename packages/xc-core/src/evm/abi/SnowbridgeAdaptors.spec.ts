import { Abi } from './index';

type AbiFn = {
  type: string;
  name?: string;
  inputs: { type: string; name?: string; components?: AbiFn['inputs'] }[];
  stateMutability?: string;
};

const findFn = (abi: readonly unknown[], name: string): AbiFn | undefined =>
  abi.find(
    (e) => (e as AbiFn).type === 'function' && (e as AbiFn).name === name
  ) as AbiFn | undefined;

describe('SnowbridgeL2Adaptor ABI', () => {
  const abi = Abi.SnowbridgeL2Adaptor as unknown as readonly AbiFn[];

  it('exposes sendTokenAndCall with (DepositParams, SwapParams, SendParams, address, bytes32)', () => {
    const fn = findFn(abi, 'sendTokenAndCall');
    expect(fn).toBeDefined();
    expect(fn!.inputs.map((i) => i.type)).toEqual([
      'tuple',
      'tuple',
      'tuple',
      'address',
      'bytes32',
    ]);
    expect(fn!.stateMutability).toBe('nonpayable');
  });

  it('exposes sendEtherAndCall as payable', () => {
    const fn = findFn(abi, 'sendEtherAndCall');
    expect(fn).toBeDefined();
    expect(fn!.stateMutability).toBe('payable');
  });

  it('DepositParams struct matches Snowfork source', () => {
    const fn = findFn(abi, 'sendTokenAndCall');
    const deposit = fn!.inputs[0].components!;
    expect(deposit.map((c) => `${c.name}:${c.type}`)).toEqual([
      'inputToken:address',
      'outputToken:address',
      'inputAmount:uint256',
      'outputAmount:uint256',
      'destinationChainId:uint256',
      'fillDeadlineBuffer:uint32',
    ]);
  });

  it('SendParams struct matches Snowfork source', () => {
    const fn = findFn(abi, 'sendTokenAndCall');
    const send = fn!.inputs[2].components!;
    expect(send.map((c) => `${c.name}:${c.type}`)).toEqual([
      'xcm:bytes',
      'assets:bytes[]',
      'claimer:bytes',
      'executionFee:uint128',
      'relayerFee:uint128',
    ]);
  });
});

describe('SnowbridgeL1Adaptor ABI', () => {
  const abi = Abi.SnowbridgeL1Adaptor as unknown as readonly AbiFn[];

  it('exposes depositToken with (DepositParams, address, bytes32)', () => {
    const fn = findFn(abi, 'depositToken');
    expect(fn).toBeDefined();
    expect(fn!.inputs.map((i) => i.type)).toEqual([
      'tuple',
      'address',
      'bytes32',
    ]);
    expect(fn!.stateMutability).toBe('nonpayable');
  });

  it('exposes depositNativeEther with (DepositParams, address, bytes32)', () => {
    const fn = findFn(abi, 'depositNativeEther');
    expect(fn).toBeDefined();
    expect(fn!.inputs.map((i) => i.type)).toEqual([
      'tuple',
      'address',
      'bytes32',
    ]);
  });
});
