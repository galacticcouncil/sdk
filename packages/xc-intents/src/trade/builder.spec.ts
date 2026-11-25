import { CallType } from '@galacticcouncil/xc-core';

import { decodeFunctionData, getAddress } from 'viem';

import { WETH_ERC20 } from '../consts';
import { GOLDEN_TERMS } from '../terms/fixtures';

import { DISPATCHER_ABI, ERC20_ABI } from './abi';
import { buildCloseCalls, buildDispatchCalls } from './builder';

const OWNER = GOLDEN_TERMS.owner;
const DISPATCHER = `0x${'2c'.repeat(20)}` as const;
const DEPOSIT = `0x${'44'.repeat(20)}` as const;

describe('buildDispatchCalls', () => {
  const params = {
    from: OWNER,
    dispatcher: DISPATCHER,
    amount: 10n ** 16n,
    depositAddress: DEPOSIT,
    maxRelayFee: 123n,
    terms: GOLDEN_TERMS,
    approved: false,
  };

  it('approves the dispatcher on WETH, then dispatches', () => {
    const [approve, dispatch] = buildDispatchCalls(params);

    expect(approve.to).toBe(WETH_ERC20);
    expect(approve.allowance).toBe(params.amount);
    expect(
      decodeFunctionData({ abi: ERC20_ABI, data: approve.data as any }).args
    ).toEqual([getAddress(DISPATCHER), params.amount]);

    expect(dispatch.from).toBe(OWNER);
    expect(dispatch.to).toBe(DISPATCHER);
    expect(dispatch.type).toBe(CallType.Evm);
    const { functionName, args } = decodeFunctionData({
      abi: DISPATCHER_ABI,
      data: dispatch.data as any,
    });
    expect(functionName).toBe('dispatch');
    expect(args?.slice(0, 3)).toEqual([
      params.amount,
      getAddress(DEPOSIT),
      123n,
    ]);
    expect((args?.[3] as any).recipient).toBe(GOLDEN_TERMS.recipient);
  });

  it('skips the approve when already approved', () => {
    const calls = buildDispatchCalls({ ...params, approved: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].to).toBe(DISPATCHER);
  });
});

describe('buildCloseCalls', () => {
  it('closes the terms with the delay, paying the message fee', () => {
    const [close] = buildCloseCalls({
      from: OWNER,
      dispatcher: DISPATCHER,
      terms: GOLDEN_TERMS,
      delay: 3600,
      messageFee: 7n,
    });
    expect(close.value).toBe(7n);
    const { functionName, args } = decodeFunctionData({
      abi: DISPATCHER_ABI,
      data: close.data as any,
    });
    expect(functionName).toBe('close');
    expect(args?.[1]).toBe(3600n);
  });
});
