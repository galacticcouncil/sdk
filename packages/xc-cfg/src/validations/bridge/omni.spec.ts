import { jest } from '@jest/globals';

import {
  AnyChain,
  AssetAmount,
  TransferCtx,
  TransferValidationError,
} from '@galacticcouncil/xc-core';

import { zec } from '../../assets';
import { ethereum, hydration, near_chain, zcash } from '../../chains';
import { OmniClient } from '../../clients';

import { NttCustodyValidation, NttRateLimitValidation } from './ntt';
import { OmniValidation } from './omni';

const H160 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const T1 = 't1KfwsnwJeNRVjQGBDZhwKskpQbih2qx5Ua';

const CONFIG = {
  min_deposit_amount: '100000',
  min_withdraw_amount: '100000',
  refund_timelock_sec: 172800,
  withdraw_bridge_fee: { fee_min: '10000', fee_rate: 0 },
};

const ctxFor = (
  from: AnyChain,
  to: AnyChain,
  amount: bigint,
  sender: string,
  address: string
): TransferCtx => {
  const source = AssetAmount.fromAsset(zec, {
    amount: 10n ** 8n,
    decimals: 8,
  });
  const destination = AssetAmount.fromAsset(zec, { amount: 0n, decimals: 8 });
  return {
    address: address,
    amount: amount,
    asset: zec,
    sender: sender,
    source: {
      balance: source,
      chain: from,
      destinationFee: source.copyWith({ amount: 0n }),
      destinationFeeBalance: source,
      fee: source.copyWith({ amount: 0n }),
      feeBalance: source,
    },
    destination: {
      balance: destination,
      chain: to,
      fee: destination,
      feeBreakdown: {},
    },
  };
};

const deposit = (amount: bigint) => ctxFor(zcash, hydration, amount, T1, H160);
const withdrawal = (amount: bigint) =>
  ctxFor(hydration, zcash, amount, H160, T1);

const mockConfig = () =>
  jest
    .spyOn(OmniClient.prototype, 'getConfig')
    .mockResolvedValue(CONFIG as never);

const mockEmitterFee = (fee: Promise<bigint>) =>
  jest.spyOn(hydration.evmClient, 'getProvider').mockReturnValue({
    readContract: () => fee,
  } as never);

/** The ntt leg checks, recording the ctx each ran on. */
const mockLeg = () => {
  const legs: TransferCtx[] = [];
  const record = async (ctx: TransferCtx) => {
    legs.push(ctx);
  };
  jest
    .spyOn(NttRateLimitValidation.prototype, 'validate')
    .mockImplementation(record);
  jest
    .spyOn(NttCustodyValidation.prototype, 'validate')
    .mockImplementation(record);
  return legs;
};

const reportOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (e) {
    return (e as TransferValidationError).report;
  }
  throw new Error('expected a validation error');
};

describe('OmniValidation', () => {
  const validation = new OmniValidation(
    near_chain,
    () => true,
    () => true
  );

  afterEach(() => jest.restoreAllMocks());

  it('should skip a transfer without an omni end', async () => {
    const config = mockConfig();
    const legs = mockLeg();

    await validation.validate(ctxFor(hydration, ethereum, 1n, H160, H160));
    expect(config).not.toHaveBeenCalled();
    expect(legs).toHaveLength(0);
  });

  describe('deposit', () => {
    it('should refuse an amount below the connector minimum', async () => {
      mockConfig();
      mockLeg();

      expect(await reportOf(validation.validate(deposit(99_999n)))).toEqual({
        amount: '0.001',
        asset: 'ZEC',
        chain: 'Zcash',
        decimals: 8,
        min: 100_000n,
        error: 'omni.belowMinDeposit',
      });
    });

    it('should check the ntt leg from the hub', async () => {
      mockConfig();
      const legs = mockLeg();

      await validation.validate(deposit(100_000n));
      expect(legs).toHaveLength(2);
      for (const leg of legs) {
        expect(leg.amount).toBe(100_000n);
        expect(leg.source.chain).toBe(near_chain);
        expect(leg.destination.chain).toBe(hydration);
      }
    });

    it('should fail closed when the connector cannot be read', async () => {
      jest
        .spyOn(OmniClient.prototype, 'getConfig')
        .mockRejectedValue(new Error('near rpc 503'));

      expect(await reportOf(validation.validate(deposit(100_000n)))).toEqual({
        chain: 'Zcash',
        error: 'omni.connectorUnreachable',
      });
    });
  });

  describe('withdrawal', () => {
    it('should refuse an amount below the emitter fee and the minimum', async () => {
      mockConfig();
      mockEmitterFee(Promise.resolve(10_000n));
      mockLeg();

      expect(await reportOf(validation.validate(withdrawal(109_999n)))).toEqual(
        {
          amount: '0.0011',
          asset: 'ZEC',
          chain: 'Zcash',
          decimals: 8,
          min: 110_000n,
          error: 'omni.belowMinWithdraw',
        }
      );
    });

    it('should check the ntt leg to the hub', async () => {
      mockConfig();
      mockEmitterFee(Promise.resolve(10_000n));
      const legs = mockLeg();

      await validation.validate(withdrawal(110_000n));
      expect(legs).toHaveLength(2);
      for (const leg of legs) {
        expect(leg.source.chain).toBe(hydration);
        expect(leg.destination.chain).toBe(near_chain);
      }
    });

    it('should pass on a refused ntt leg', async () => {
      mockConfig();
      mockEmitterFee(Promise.resolve(10_000n));
      mockLeg();
      jest
        .spyOn(NttRateLimitValidation.prototype, 'validate')
        .mockRejectedValue(
          new TransferValidationError('Ntt_Outbound_Limit_Exceeded', {
            error: 'ntt.outboundLimitExceeded',
          })
        );

      expect(await reportOf(validation.validate(withdrawal(110_000n)))).toEqual(
        { error: 'ntt.outboundLimitExceeded' }
      );
    });

    it('should fail closed when the emitter cannot be read', async () => {
      mockConfig();
      mockEmitterFee(Promise.reject(new Error('evm rpc down')));

      expect(await reportOf(validation.validate(withdrawal(110_000n)))).toEqual(
        {
          chain: 'Hydration',
          error: 'omni.connectorUnreachable',
        }
      );
    });
  });
});
