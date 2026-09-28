import {
  AssetAmount,
  FunctionCallConfig,
  NearChain,
} from '@galacticcouncil/xc-core';

import { NearPlatform } from './NearPlatform';

const ACCOUNT = 'alice.testnet';
const TOKEN = 'wrap.testnet';
const MANAGER = 'ntt-near.whm-ntt-0bugdc.testnet';

const AMOUNT = 2_000_000_000_000_000_000_000_000n;
const REGISTRATION = 1_250_000_000_000_000_000_000n;

const GAS_PRICE = 100_000_000n;
const TRANSFER_GAS = 150_000_000_000_000n;
const WRAP_GAS = 10_000_000_000_000n;

/** A basic account's own storage, staked at 1e19 yocto per byte. */
const STORAGE_USAGE = 182;
const STAKE = BigInt(STORAGE_USAGE) * 10n ** 19n;

const feeBalance = {
  copyWith: ({ amount }: { amount: bigint }) => ({ amount }),
} as unknown as AssetAmount;

const transferConfig = (wrapNative: boolean, receiverId = TOKEN) =>
  new FunctionCallConfig({
    receiverId: receiverId,
    args: { receiver_id: MANAGER, amount: AMOUNT.toString(), msg: '{}' },
    gas: TRANSFER_GAS,
    deposit: 1n,
    wrapNative: wrapNative,
    func: 'ft_transfer_call',
    module: 'NttManager',
  });

/** Chain stub serving the token views, gas price & account state. */
const mockChain = (registered: boolean, wrapped: bigint) =>
  ({
    client: {
      view: async (_contract: string, method: string) => {
        if (method === 'storage_balance_of') {
          return registered ? { total: '1', available: '0' } : null;
        }
        if (method === 'ft_balance_of') return wrapped.toString();
        if (method === 'storage_balance_bounds') {
          return { min: REGISTRATION.toString(), max: REGISTRATION.toString() };
        }
        throw new Error('Unexpected view: ' + method);
      },
      getGasPrice: async () => GAS_PRICE,
      viewAccount: async () => ({
        amount: '0',
        locked: '0',
        storage_usage: STORAGE_USAGE,
      }),
    },
  }) as unknown as NearChain;

const platform = (registered = true, wrapped = 0n) =>
  new NearPlatform(mockChain(registered, wrapped));

describe('NearPlatform', () => {
  describe('token source', () => {
    it('should send the transfer alone', async () => {
      const [call, ...rest] = await platform().buildCalls(
        ACCOUNT,
        AMOUNT,
        feeBalance,
        [transferConfig(false)]
      );

      expect(rest).toHaveLength(0);
      expect(call.receiverId).toBe(TOKEN);
      expect(call.actions.map((a) => a.methodName)).toEqual([
        'ft_transfer_call',
      ]);
    });

    // The amount is drawn from the token, so only gas, the yocto & the
    // storage stake come out of the near balance.
    it('should charge prepaid gas, deposits & the storage stake', async () => {
      const fee = await platform().estimateFee(ACCOUNT, AMOUNT, feeBalance, [
        transferConfig(false),
      ]);
      expect(fee.amount).toBe(TRANSFER_GAS * GAS_PRICE + 1n + STAKE);
    });
  });

  describe('native source', () => {
    // One receiver, so registration, wrap & transfer run atomically - a
    // refused transfer unwinds the wrap with it.
    it('should register, wrap & transfer in one transaction', async () => {
      const calls = await platform(false).buildCalls(
        ACCOUNT,
        AMOUNT,
        feeBalance,
        [transferConfig(true)]
      );

      expect(calls).toHaveLength(1);
      expect(calls[0].actions).toEqual([
        {
          methodName: 'storage_deposit',
          args: { registration_only: true },
          gas: WRAP_GAS,
          deposit: REGISTRATION,
        },
        {
          methodName: 'near_deposit',
          args: {},
          gas: WRAP_GAS,
          deposit: AMOUNT,
        },
        expect.objectContaining({ methodName: 'ft_transfer_call' }),
      ]);
    });

    it('should skip the registration of a registered sender', async () => {
      const [call] = await platform(true).buildCalls(
        ACCOUNT,
        AMOUNT,
        feeBalance,
        [transferConfig(true)]
      );
      expect(call.actions.map((a) => a.methodName)).toEqual([
        'near_deposit',
        'ft_transfer_call',
      ]);
    });

    it('should wrap only the shortfall of a held token balance', async () => {
      const held = 500_000_000_000_000_000_000_000n;
      const [call] = await platform(true, held).buildCalls(
        ACCOUNT,
        AMOUNT,
        feeBalance,
        [transferConfig(true)]
      );
      expect(call.actions[0]).toMatchObject({
        methodName: 'near_deposit',
        deposit: AMOUNT - held,
      });
    });

    it('should not wrap when the token balance covers the amount', async () => {
      const [call] = await platform(true, AMOUNT).buildCalls(
        ACCOUNT,
        AMOUNT,
        feeBalance,
        [transferConfig(true)]
      );
      expect(call.actions.map((a) => a.methodName)).toEqual([
        'ft_transfer_call',
      ]);
    });

    // Max is balance - fee: the wrapped near is the amount itself, the
    // registration is a cost.
    it('should leave the wrapped amount out of the fee', async () => {
      const fee = await platform(false).estimateFee(
        ACCOUNT,
        AMOUNT,
        feeBalance,
        [transferConfig(true)]
      );
      expect(fee.amount).toBe(
        (TRANSFER_GAS + 2n * WRAP_GAS) * GAS_PRICE + REGISTRATION + 1n + STAKE
      );
    });
  });

  describe('transactions', () => {
    it('should batch consecutive calls on one receiver', async () => {
      const calls = await platform().buildCalls(ACCOUNT, AMOUNT, feeBalance, [
        transferConfig(false),
        transferConfig(false),
      ]);
      expect(calls).toHaveLength(1);
      expect(calls[0].actions).toHaveLength(2);
    });

    it('should split calls on different receivers', async () => {
      const calls = await platform().buildCalls(ACCOUNT, AMOUNT, feeBalance, [
        transferConfig(false),
        transferConfig(false, MANAGER),
      ]);
      expect(calls.map((c) => c.receiverId)).toEqual([TOKEN, MANAGER]);
    });
  });
});
