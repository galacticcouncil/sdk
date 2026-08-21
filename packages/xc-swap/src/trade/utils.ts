import { AssetAmount } from '@galacticcouncil/xc-core';

import type { XcSwapAsset } from '../types';

const BPS = 10_000n;

/** Build an {@link AssetAmount} for a swap asset descriptor. */
export function amount(asset: XcSwapAsset, amount: bigint): AssetAmount {
  return new AssetAmount({
    key: asset.key,
    originSymbol: asset.symbol,
    symbol: asset.symbol,
    decimals: asset.decimals,
    amount,
  });
}

/** Apply a positive slippage pad (round up). */
export function padUp(value: bigint, bps: number): bigint {
  return (value * (BPS + BigInt(bps))) / BPS;
}

/** Apply a negative slippage floor (round down). */
export function padDown(value: bigint, bps: number): bigint {
  return (value * (BPS - BigInt(bps))) / BPS;
}
