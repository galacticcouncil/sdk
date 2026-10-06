import { jest } from '@jest/globals';

import {
  Asset,
  AssetAmount,
  SwapCtx,
  TransferCtx,
} from '@galacticcouncil/xc-core';

import { eth, hdx, weth_wh } from '../../assets';
import { ethereum, hydration } from '../../chains';

import { HydrationEvmValueValidation } from './hydration';

const HDX = 10n ** 12n;

// 2026-10-05 mainnet: executor cost of a weth -> ethereum transfer, and the
// fee charged on the batch carrying it.
const EXECUTOR_COST = 1_421_668_603_500_000n;
const NETWORK_FEE = 2_409_940_895_265n;

// The oracle price behind it: 1 hdx ~ 0.0000027366 weth.
const WEI_PER_PLANCK = { n: 2_736_565n, d: 1_000_000n };

const hdxAmount = (amount: bigint) =>
  AssetAmount.fromAsset(hdx, { amount: amount, decimals: 12 });

const wethAmount = (amount: bigint) =>
  AssetAmount.fromAsset(weth_wh, { amount: amount, decimals: 18 });

/** Hydration -> ethereum executor route, fees paid from `feeBalance`. */
const ctxFor = (params: {
  asset?: Asset;
  amount?: bigint;
  feeBalance: AssetAmount;
  fee?: AssetAmount;
  prepaid?: boolean;
  swap?: SwapCtx;
}): TransferCtx => {
  const destination = AssetAmount.fromAsset(eth, {
    amount: 0n,
    decimals: 18,
  });
  return {
    address: '0x59197B192F4104982196dA9A003C934736f0aC3D',
    amount: params.amount ?? 10n ** 17n,
    asset: params.asset ?? weth_wh,
    sender: '14jDRFWbYYVzhTcHhxiPXS1TPMFMzhmsu5AUyKfmYwHRoxNm',
    source: {
      balance: wethAmount(8_950_000_000_000_000_000n),
      chain: hydration,
      destinationFee: wethAmount(EXECUTOR_COST),
      destinationFeeBalance: wethAmount(8_950_000_000_000_000_000n),
      destinationFeePrepaid: params.prepaid ?? true,
      destinationFeeSwap: params.swap,
      fee: params.fee ?? hdxAmount(NETWORK_FEE),
      feeBalance: params.feeBalance,
    },
    destination: {
      balance: destination,
      chain: ethereum,
      fee: destination,
      feeBreakdown: {},
    },
  };
};

/** Hdx it takes to buy `amountOut` weth at {@link WEI_PER_PLANCK}. */
const mockDex = () => {
  const getQuote = jest.fn(
    async (_in: Asset, _out: Asset, amountOut: AssetAmount) => ({
      amount: (amountOut.amount * WEI_PER_PLANCK.d) / WEI_PER_PLANCK.n,
      route: [],
    })
  );
  jest.spyOn(hydration, 'dex', 'get').mockReturnValue({ getQuote } as any);
  return getQuote;
};

/** Executor cost padded by the margin, priced in hdx, plus the fee. */
const required = (extra = 0n) =>
  (((EXECUTOR_COST * 105n) / 100n) * WEI_PER_PLANCK.d) / WEI_PER_PLANCK.n +
  NETWORK_FEE +
  extra;

describe('HydrationEvmValueValidation', () => {
  const validation = new HydrationEvmValueValidation(
    () => true,
    () => true
  );

  afterEach(() => jest.restoreAllMocks());

  // Extrinsic 15432221-2: 8.95 weth held, 139.7 hdx, EVM.BalanceLow.
  it('should reject a fee currency below the priced delivery fee', async () => {
    mockDex();
    const ctx = ctxFor({ feeBalance: hdxAmount(139_717_350_269_058n) });
    await expect(validation.validate(ctx)).rejects.toMatchObject({
      message: 'Insufficient_Fee_Balance',
      report: {
        amount: hdxAmount(required()).toDecimal(),
        asset: 'HDX',
        chain: 'Hydration',
        error: 'fee.insufficientBalance',
      },
    });
  });

  // Extrinsic 15432335-2: same account after topping up to 786.5 hdx.
  it('should pass a fee currency covering the priced delivery fee', async () => {
    mockDex();
    const ctx = ctxFor({ feeBalance: hdxAmount(786_490_044_865_823n) });
    await expect(validation.validate(ctx)).resolves.toBeUndefined();
  });

  it('should skip a route without a prepaid delivery fee', async () => {
    const getQuote = mockDex();
    const ctx = ctxFor({ feeBalance: hdxAmount(0n), prepaid: false });
    await expect(validation.validate(ctx)).resolves.toBeUndefined();
    expect(getQuote).not.toHaveBeenCalled();
  });

  it('should skip a fee currency held as weth', async () => {
    const getQuote = mockDex();
    const ctx = ctxFor({
      feeBalance: wethAmount(0n),
      fee: wethAmount(0n),
    });
    await expect(validation.validate(ctx)).resolves.toBeUndefined();
    expect(getQuote).not.toHaveBeenCalled();
  });

  // Hdx leaves the account in the batch before the executor call runs.
  it('should count a transfer of the fee currency itself', async () => {
    mockDex();
    const balance = hdxAmount(600n * HDX);
    await expect(
      validation.validate(
        ctxFor({ asset: hdx, amount: 10n * HDX, feeBalance: balance })
      )
    ).resolves.toBeUndefined();
    await expect(
      validation.validate(
        ctxFor({ asset: hdx, amount: 100n * HDX, feeBalance: balance })
      )
    ).rejects.toMatchObject({
      report: { amount: hdxAmount(required(100n * HDX)).toDecimal() },
    });
  });

  it('should count the input of an enabled fee swap', async () => {
    mockDex();
    const swap = (enabled: boolean): SwapCtx => ({
      aIn: hdxAmount(100n * HDX),
      aOut: wethAmount(EXECUTOR_COST),
      enabled: enabled,
      route: [],
    });
    const balance = hdxAmount(600n * HDX);
    await expect(
      validation.validate(ctxFor({ feeBalance: balance, swap: swap(false) }))
    ).resolves.toBeUndefined();
    await expect(
      validation.validate(ctxFor({ feeBalance: balance, swap: swap(true) }))
    ).rejects.toMatchObject({
      report: { amount: hdxAmount(required(100n * HDX)).toDecimal() },
    });
  });

  it('should pass when the dex cannot price the fee currency', async () => {
    jest.spyOn(hydration, 'dex', 'get').mockReturnValue({
      getQuote: jest.fn(async () => {
        throw new Error('no route');
      }),
    } as any);
    const ctx = ctxFor({ feeBalance: hdxAmount(0n) });
    await expect(validation.validate(ctx)).resolves.toBeUndefined();
  });
});
