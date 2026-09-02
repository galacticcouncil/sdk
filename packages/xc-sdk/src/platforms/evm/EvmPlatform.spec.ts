import {
  Abi,
  AnyEvmChain,
  AssetAmount,
  ContractConfig,
} from '@galacticcouncil/xc-core';

import { EvmPlatform } from './EvmPlatform';
import { EvmCall } from './types';

const ACCOUNT = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const SS58 = '7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const MANAGER = '0x1111111111111111111111111111111111111111';
const RECIPIENT_32 =
  '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045';

const DEPOSIT = '0xd0e30db0';
const APPROVE = '0x095ea7b3';

const AMOUNT = 1_000_000_000_000_000_000n;
const DELIVERY_PRICE = 100n;

const GAS_PRICE = 1_000_000_000n;
const TRANSFER_GAS = 300_000n;

/** Fee gas ceilings of EvmPlatform - weth deposit, erc20 approve, transfer. */
const FEE_GAS = { deposit: 60_000n, approve: 70_000n, transfer: 500_000n };

const feeBalance = {
  copyWith: ({ amount }: { amount: bigint }) => ({ amount }),
} as unknown as AssetAmount;

const EXECUTOR = '0x9999999999999999999999999999999999999999';
const REQUEST_COST = 57578720500000n;

/** Executor request the ntt bypass appends after the manager transfer. */
const executorConfig = () =>
  new ContractConfig({
    abi: Abi.Executor,
    address: EXECUTOR,
    args: [73, RECIPIENT_32, ACCOUNT, '0xdead', '0x45524e31', '0x01'],
    value: REQUEST_COST,
    func: 'requestExecution',
    module: 'Executor',
  });

const buildConfigs = (wrapNative: boolean, trailing?: ContractConfig) => [
  new ContractConfig({
    abi: Abi.NttManager,
    address: MANAGER,
    args: [AMOUNT, 73, RECIPIENT_32],
    token: WETH,
    wrapNative: wrapNative,
    value: DELIVERY_PRICE,
    func: 'transfer',
    module: 'NttManager',
  }),
  ...(trailing ? [trailing] : []),
];

/** Chain stub serving the erc20 reads, gas price & gas estimate. */
const mockChain = (wrapped: bigint, allowance: bigint) =>
  ({
    evmClient: {
      getProvider: () => ({
        readContract: async ({ functionName }: { functionName: string }) => {
          if (functionName === 'balanceOf') return wrapped;
          if (functionName === 'allowance') return allowance;
          throw new Error('Unexpected read: ' + functionName);
        },
        getGasPrice: async () => GAS_PRICE,
        estimateContractGas: async () => TRANSFER_GAS,
      }),
    },
  }) as unknown as AnyEvmChain;

const platform = (wrapped: bigint, allowance: bigint) =>
  new EvmPlatform(mockChain(wrapped, allowance));

const buildCalls = (
  wrapped: bigint,
  allowance: bigint,
  wrapNative = true,
  trailing?: ContractConfig
): Promise<EvmCall[]> =>
  platform(wrapped, allowance).buildCalls(
    ACCOUNT,
    AMOUNT,
    feeBalance,
    buildConfigs(wrapNative, trailing)
  ) as Promise<EvmCall[]>;

describe('EvmPlatform', () => {
  describe('buildCalls', () => {
    it('should wrap, approve & transfer when no weth held', async () => {
      const calls = await buildCalls(0n, 0n);

      expect(calls).toHaveLength(3);
      expect(calls[0]).toMatchObject({ to: WETH, value: AMOUNT });
      expect(calls[0].data.startsWith(DEPOSIT)).toBe(true);
      expect(calls[1]).toMatchObject({ to: WETH });
      expect(calls[1].data.startsWith(APPROVE)).toBe(true);
      expect(calls[2]).toMatchObject({ to: MANAGER, value: 100n });
    });

    it('should wrap only the shortfall when weth is partially held', async () => {
      const wrapped = AMOUNT / 4n;
      const calls = await buildCalls(wrapped, 0n);

      expect(calls).toHaveLength(3);
      expect(calls[0]).toMatchObject({ to: WETH, value: AMOUNT - wrapped });
    });

    it('should skip the wrap when weth held covers the amount', async () => {
      const calls = await buildCalls(AMOUNT, 0n);

      expect(calls).toHaveLength(2);
      expect(calls[0].data.startsWith(APPROVE)).toBe(true);
      expect(calls[1]).toMatchObject({ to: MANAGER });
    });

    it('should transfer only when erc20 source is already approved', async () => {
      const calls = await buildCalls(0n, AMOUNT, false);

      expect(calls).toHaveLength(1);
      expect(calls[0]).toMatchObject({ to: MANAGER });
    });

    // The ntt executor bypass: the manager transfer emits the message, then a
    // second call pays the Executor to deliver it. Reversing them pays for a
    // message that does not exist yet.
    it('should keep the configs in the order the builder returned them', async () => {
      const calls = await buildCalls(0n, AMOUNT, false, executorConfig());

      expect(calls).toHaveLength(2);
      expect(calls[0]).toMatchObject({ to: MANAGER });
      expect(calls[1]).toMatchObject({ to: EXECUTOR, value: REQUEST_COST });
    });

    it('should run every prerequisite ahead of the whole sequence', async () => {
      const calls = await buildCalls(0n, 0n, true, executorConfig());

      expect(calls).toHaveLength(4);
      expect(calls.map((c) => c.to)).toEqual([WETH, WETH, MANAGER, EXECUTOR]);
    });

    // Only the first config spends the token - the ones after it pay in native
    // value, so they must not drag in an approve of their own.
    it('should derive prerequisites from the first config only', async () => {
      const calls = await buildCalls(0n, AMOUNT, false, executorConfig());

      expect(calls.filter((c) => c.data.startsWith(APPROVE))).toHaveLength(0);
    });

    // A substrate origin reaches the same calls through the route's extrinsic
    // config, where they are wrapped in EVM.call. Building them here would
    // hand back an evm transaction the signer cannot sign.
    it('should reject a substrate origin', async () => {
      await expect(
        platform(0n, 0n).buildCalls(
          SS58,
          AMOUNT,
          feeBalance,
          buildConfigs(false)
        )
      ).rejects.toThrow('h160 origin');
    });
  });

  describe('estimateFee', () => {
    const estimateFee = (
      wrapped: bigint,
      allowance: bigint,
      wrapNative = true
    ) =>
      platform(wrapped, allowance).estimateFee(
        ACCOUNT,
        AMOUNT,
        feeBalance,
        buildConfigs(wrapNative)
      );

    it('should charge the whole sequence & delivery price when wrapping', async () => {
      const fee = await estimateFee(0n, 0n);

      const gas = FEE_GAS.deposit + FEE_GAS.approve + FEE_GAS.transfer;
      expect(fee.amount).toBe(gas * GAS_PRICE + DELIVERY_PRICE);
    });

    it('should drop the wrap gas once weth is held', async () => {
      const fee = await estimateFee(AMOUNT, 0n);

      const gas = FEE_GAS.approve + FEE_GAS.transfer;
      expect(fee.amount).toBe(gas * GAS_PRICE + DELIVERY_PRICE);
    });

    it('should measure the transfer gas with no prerequisite pending', async () => {
      const fee = await estimateFee(AMOUNT, AMOUNT);

      expect(fee.amount).toBe(TRANSFER_GAS * GAS_PRICE + DELIVERY_PRICE);
    });

    // The value is either the route's destination fee or paid from a balance
    // the amount never competes for, so charging it here would double it.
    it('should charge gas only for an erc20 source', async () => {
      const fee = await estimateFee(AMOUNT, AMOUNT, false);

      expect(fee.amount).toBe(TRANSFER_GAS * GAS_PRICE);
    });

    // The transfer reverts until the approve lands, so estimating it alone
    // returned nothing at all - a zero source fee, and a max of the whole
    // balance.
    it('should charge the pending approve on an erc20 source', async () => {
      const fee = await estimateFee(0n, 0n, false);

      const gas = FEE_GAS.approve + FEE_GAS.transfer;
      expect(fee.amount).toBe(gas * GAS_PRICE);
    });

    // Wallet probes the fee before anything is typed in.
    it('should charge nothing for a zero amount', async () => {
      const fee = await platform(0n, 0n).estimateFee(
        ACCOUNT,
        0n,
        feeBalance,
        buildConfigs(false)
      );

      expect(fee.amount).toBe(0n);
    });

    it('should leave the sender able to cover the sequence at max', async () => {
      const balance = 10n * AMOUNT;
      // Fee estimated at the initial probing amount, as Wallet does
      const fee = await platform(0n, 0n).estimateFee(
        ACCOUNT,
        10n,
        feeBalance,
        buildConfigs(true)
      );
      const max = balance - fee.amount;

      // Actual on chain cost of sending max - wrap, approve & transfer
      const spent =
        max + DELIVERY_PRICE + (28_000n + 46_000n + TRANSFER_GAS) * GAS_PRICE;
      expect(spent).toBeLessThan(balance);
    });
  });
});
