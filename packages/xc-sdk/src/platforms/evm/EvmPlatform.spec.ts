import {
  Abi,
  AnyEvmChain,
  AssetAmount,
  ContractConfig,
} from '@galacticcouncil/xc-core';

import { EvmPlatform } from './EvmPlatform';
import { EvmCall } from './types';

const ACCOUNT = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
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

const buildConfig = (wrapNative: boolean) =>
  new ContractConfig({
    abi: Abi.NttManager,
    address: MANAGER,
    args: [AMOUNT, 73, RECIPIENT_32],
    token: WETH,
    wrapNative: wrapNative,
    value: DELIVERY_PRICE,
    func: 'transfer',
    module: 'NttManager',
  });

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
  wrapNative = true
): Promise<EvmCall[]> =>
  platform(wrapped, allowance).buildCalls(
    ACCOUNT,
    AMOUNT,
    feeBalance,
    buildConfig(wrapNative)
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
        buildConfig(wrapNative)
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

    it('should charge gas only for an erc20 source', async () => {
      const fee = await estimateFee(0n, 0n, false);

      expect(fee.amount).toBe(TRANSFER_GAS * GAS_PRICE);
    });

    it('should leave the sender able to cover the sequence at max', async () => {
      const balance = 10n * AMOUNT;
      // Fee estimated at the initial probing amount, as Wallet does
      const fee = await platform(0n, 0n).estimateFee(
        ACCOUNT,
        10n,
        feeBalance,
        buildConfig(true)
      );
      const max = balance - fee.amount;

      // Actual on chain cost of sending max - wrap, approve & transfer
      const spent =
        max + DELIVERY_PRICE + (28_000n + 46_000n + TRANSFER_GAS) * GAS_PRICE;
      expect(spent).toBeLessThan(balance);
    });
  });

  describe('buildCall', () => {
    it('should return the head of the call sequence', async () => {
      const call = (await platform(0n, 0n).buildCall(
        ACCOUNT,
        AMOUNT,
        feeBalance,
        buildConfig(true)
      )) as EvmCall;

      expect(call.to).toBe(WETH);
      expect(call.data.startsWith(DEPOSIT)).toBe(true);
    });
  });
});
