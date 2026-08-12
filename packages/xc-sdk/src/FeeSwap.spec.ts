import {
  Asset,
  AssetAmount,
  Parachain,
  TransferCtx,
} from '@galacticcouncil/xc-core';

import { FeeSwap } from './FeeSwap';

const hdx = new Asset({ key: 'hdx', originSymbol: 'HDX' });
const weth = new Asset({ key: 'weth_wh', originSymbol: 'WETH' });

const amountOf = (asset: Asset, amount: bigint, decimals = 18) =>
  AssetAmount.fromAsset(asset, { amount, decimals });

/** Live hydration figures from the failing executor transfer. */
const DEST_FEE = 597_648_501_500_000n;
const WETH_MIN = 5_400_000_000_000n;

/** Quotes 1:1 so the swap input mirrors the requested output. */
const dex = {
  getQuote: async (
    _aIn: AssetAmount,
    _aOut: AssetAmount,
    target: AssetAmount
  ) => ({ amount: target.amount, route: [] }),
};

const buildCtx = (destFeeBalance: bigint, hdxBalance = 10n ** 18n) => {
  // Real prototype so the `instanceof Parachain` branch is the one exercised;
  // `dex` is a getter on Chain, so it has to be redefined rather than assigned.
  const chain = Object.create(Parachain.prototype);
  Object.defineProperty(chain, 'dex', { get: () => dex });
  chain.getMin = async () => amountOf(weth, WETH_MIN);

  return {
    source: {
      balance: amountOf(hdx, hdxBalance, 12),
      chain,
      destinationFee: amountOf(weth, DEST_FEE),
      destinationFeeBalance: amountOf(weth, destFeeBalance),
      feeBalance: amountOf(hdx, hdxBalance, 12),
    },
  } as unknown as TransferCtx;
};

const srcFee = amountOf(hdx, 100_000_000_000n, 12);

describe('FeeSwap.getDestinationSwap', () => {
  // The bug: buying exactly the fee left the account holding an amount whose
  // last `min` is not spendable, so the evm call value came up short by the ed.
  it('should buy the destination fee plus its existential deposit', async () => {
    const swap = await new FeeSwap(buildCtx(0n)).getDestinationSwap(srcFee);

    expect(swap?.aOut.amount).toBe(DEST_FEE + WETH_MIN);
  });

  it('should leave the fee spendable down to the min after the swap', async () => {
    const swap = await new FeeSwap(buildCtx(0n)).getDestinationSwap(srcFee);
    const spendable = swap!.aOut.amount - WETH_MIN;

    expect(spendable).toBeGreaterThanOrEqual(DEST_FEE);
  });

  it('should price the input against the padded target', async () => {
    const swap = await new FeeSwap(buildCtx(0n)).getDestinationSwap(srcFee);

    expect(swap?.aIn.amount).toBe(DEST_FEE + WETH_MIN);
  });

  // A balance covering the bare fee but not the min is still short once the
  // ed is held back - it has to trigger the swap, not skip it.
  it('should enable when the balance covers the fee but not the min', async () => {
    const swap = await new FeeSwap(buildCtx(DEST_FEE)).getDestinationSwap(
      srcFee
    );

    expect(swap?.enabled).toBe(true);
  });

  it('should not enable when the balance already covers fee and min', async () => {
    const swap = await new FeeSwap(
      buildCtx(DEST_FEE + WETH_MIN)
    ).getDestinationSwap(srcFee);

    expect(swap?.enabled).toBe(false);
  });

  it('should not enable without the reserves to buy it', async () => {
    const swap = await new FeeSwap(buildCtx(0n, 1n)).getDestinationSwap(srcFee);

    expect(swap?.enabled).toBe(false);
  });
});
