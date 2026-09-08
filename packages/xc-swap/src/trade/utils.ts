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

/** Apply a negative slippage floor (round down). */
export function padDown(value: bigint, bps: number): bigint {
  return (value * (BPS - BigInt(bps))) / BPS;
}

/**
 * Quantize down to the rail's precision.
 *
 * - Mirrors the emitter's own trimming of both the floor and the settlement
 * - The remainder is left as dust rather than refunded
 *
 * @param value - amount to quantize
 * @param unit - rail precision (`TRIM_UNIT`)
 */
export function trim(value: bigint, unit: bigint): bigint {
  return value - (value % unit);
}
