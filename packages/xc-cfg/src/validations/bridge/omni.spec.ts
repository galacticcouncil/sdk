import { jest } from '@jest/globals';

import {
  AnyChain,
  AssetAmount,
  OmniClient,
  TransferCtx,
  ZecBalanceType,
  ZecChain,
} from '@galacticcouncil/xc-core';

import { zec } from '../../assets';
import { hydration, near_chain } from '../../chains';
import { NttEvmClient, NttNearClient, UNMETERED } from '../../clients/ntt';

import { NttRateLimitValidation } from './ntt';
import { OmniDepositValidation } from './omni';

const ZEC = 10n ** 8n;
const DAY_MS = 86_400_000;

const omniClient = (getConnectorConfig: OmniClient['getConnectorConfig']) => ({
  getConnector: jest.fn(() => {
    throw new Error('not read by the validation');
  }),
  getConnectorConfig: jest.fn(getConnectorConfig),
  getDepositAddress: jest.fn(async () => {
    throw new Error('not read by the validation');
  }),
});

/** Connector config reporting a floor, raw. */
const configOf = (min: unknown) =>
  omniClient(async () => ({
    min_deposit_amount: min as string,
    refund_timelock_sec: 172_800,
  }));

/** A fresh zcash chain, so nothing registered leaks between cases. */
const zcashWith = (client?: OmniClient): ZecChain => {
  const chain = new ZecChain({
    key: 'zec',
    name: 'Zcash',
    assetsData: [{ asset: zec, decimals: 8 }],
    balance: ZecBalanceType.Transparent,
  });
  return client ? chain.registerOmniClient(client) : chain;
};

/** zcash zec -> hydration zec, minted on near on the way. */
const ctxFor = (amount: bigint, source: AnyChain): TransferCtx => {
  const balance = AssetAmount.fromAsset(zec, {
    amount: 10n * ZEC,
    decimals: 8,
  });
  const destination = AssetAmount.fromAsset(zec, {
    amount: 0n,
    decimals: 8,
  });
  return {
    address: '0x11036d934be0a8DB5bF21379e35346b884117f87',
    amount: amount,
    asset: zec,
    sender: 't1NyxCchMSJD5bUhKhKFzFnFnqEtvLbxMEG',
    source: {
      balance: balance,
      chain: source,
      destinationFee: balance.copyWith({ amount: 0n }),
      destinationFeeBalance: balance,
      fee: balance.copyWith({ amount: 0n }),
      feeBalance: balance,
    },
    destination: {
      balance: destination,
      chain: hydration,
      fee: destination,
      feeBreakdown: {},
    },
  };
};

const mockLimits = () =>
  jest
    .spyOn(NttRateLimitValidation.prototype, 'validate')
    .mockResolvedValue(undefined);

const UNREACHABLE = {
  message: 'Omni_Connector_Unreachable',
  report: { chain: 'Zcash', error: 'omni.connectorUnreachable' },
};

describe('OmniDepositValidation', () => {
  const validation = new OmniDepositValidation(
    near_chain,
    () => true,
    () => true
  );

  afterEach(() => jest.restoreAllMocks());

  it('should skip a source omni takes no deposits from', async () => {
    const limits = mockLimits();
    await expect(
      validation.validate(ctxFor(ZEC, hydration))
    ).resolves.toBeUndefined();
    expect(limits).not.toHaveBeenCalled();
  });

  it('should read the floor from the connector, through the chain client', async () => {
    const client = configOf('100000');
    mockLimits();
    await validation.validate(ctxFor(ZEC, zcashWith(client)));
    expect(client.getConnectorConfig).toHaveBeenCalledWith('zcash');
  });

  it('should reject a deposit below the floor, naming it', async () => {
    mockLimits();
    await expect(
      validation.validate(ctxFor(99_999n, zcashWith(configOf('100000'))))
    ).rejects.toMatchObject({
      message: 'Omni_Below_Min_Deposit',
      report: {
        amount: '0.001',
        asset: 'ZEC',
        chain: 'Zcash',
        decimals: 8,
        min: 100_000n,
        error: 'omni.belowMinDeposit',
      },
    });
  });

  it('should pass a deposit of exactly the floor', async () => {
    const limits = mockLimits();
    await expect(
      validation.validate(ctxFor(100_000n, zcashWith(configOf('100000'))))
    ).resolves.toBeUndefined();
    expect(limits).toHaveBeenCalledTimes(1);
  });

  it('should pass without an amount', async () => {
    const limits = mockLimits();
    await expect(
      validation.validate(ctxFor(0n, zcashWith(configOf('100000'))))
    ).resolves.toBeUndefined();
    expect(limits).toHaveBeenCalledTimes(1);
  });

  it('should check the manager limits as a transfer from the hub', async () => {
    const limits = mockLimits();
    await validation.validate(ctxFor(ZEC, zcashWith(configOf('100000'))));

    const [hubCtx] = limits.mock.calls[0];
    expect(hubCtx.source.chain).toBe(near_chain);
    expect(hubCtx.source.balance.decimals).toBe(8);
    expect(hubCtx.amount).toBe(ZEC);
    expect(hubCtx.destination.chain).toBe(hydration);
  });

  it('should reject a deposit above the manager outbound capacity', async () => {
    jest.spyOn(NttNearClient.prototype, 'getOutboundLimit').mockResolvedValue({
      capacity: 5n * ZEC,
      limit: 10n * ZEC,
      windowMs: DAY_MS,
      capacityAtLastTx: 5n * ZEC,
      lastTxMs: 0,
    });
    jest
      .spyOn(NttEvmClient.prototype, 'getInboundLimit')
      .mockResolvedValue(UNMETERED);

    await expect(
      validation.validate(ctxFor(6n * ZEC, zcashWith(configOf('100000'))))
    ).rejects.toMatchObject({
      message: 'Ntt_Outbound_Limit_Exceeded',
      report: {
        asset: 'ZEC',
        chain: 'NEAR',
        decimals: 8,
        headroom: 5n * ZEC,
        limit: 10n * ZEC,
        error: 'ntt.outboundLimitExceeded',
      },
    });
  });

  it('should fail closed without a registered omni client', async () => {
    const limits = mockLimits();
    await expect(
      validation.validate(ctxFor(ZEC, zcashWith()))
    ).rejects.toMatchObject(UNREACHABLE);
    expect(limits).not.toHaveBeenCalled();
  });

  it('should fail closed when the connector cannot be read', async () => {
    const client = omniClient(async () => {
      throw new Error('rpc down');
    });
    await expect(
      validation.validate(ctxFor(ZEC, zcashWith(client)))
    ).rejects.toMatchObject(UNREACHABLE);
  });

  it.each([undefined, null, '', ' ', '0.001', '1e5', '-1', 100_000, {}])(
    'should fail closed on a malformed floor: %p',
    async (min) => {
      await expect(
        validation.validate(ctxFor(ZEC, zcashWith(configOf(min))))
      ).rejects.toMatchObject(UNREACHABLE);
    }
  );

  it('should fail closed on a missing connector config', async () => {
    const client = omniClient(async () => null as any);
    await expect(
      validation.validate(ctxFor(ZEC, zcashWith(client)))
    ).rejects.toMatchObject(UNREACHABLE);
  });
});
