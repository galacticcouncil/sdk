import { evm, pool, sor } from '@galacticcouncil/sdk-next';
import { Asset, Parachain } from '@galacticcouncil/xc-core';

import { config } from '../setup';
import { MoxitAsset } from './assets';

const hydration = config.getChain('hydration') as Parachain;
const usdt = config.getAsset('usdt'); // Hydration asset id 10 (≈ USD)

/**
 * Price proxies for assets with no direct USDT route on Hydration yet.
 * WBTC has no route — quote tBTC instead (both track 1 BTC).
 */
const PRICE_ALIAS: Record<string, string> = {
  wbtc_mwh: 'tbtc',
};

/** The Hydration asset to quote for a given exit asset (applies price proxies). */
function pricingAsset(asset: MoxitAsset): Asset {
  const alias = PRICE_ALIAS[asset.key];
  if (alias) {
    try {
      return config.getAsset(alias);
    } catch {
      /* fall back to the asset itself */
    }
  }
  return asset.route.source.asset;
}

let router: sor.TradeRouter | undefined;

/**
 * Smart-order-router over the Hydration pools (Omnipool/Stableswap/XYK/Aave) —
 * the same context `hydration.dex` uses, but exposing spot price directly.
 */
function getRouter(): sor.TradeRouter {
  if (!router) {
    const evmClient = new evm.EvmClient(hydration.client);
    const poolCtx = new pool.PoolContextProvider(hydration.client, evmClient)
      .withAave()
      .withOmnipool()
      .withStableswap()
      .withXyk();
    router = new sor.TradeRouter(poolCtx);
  }
  return router;
}

/**
 * USDT (≈ USD) spot price of 1 token of the asset. Uses the router spot price
 * (no trade size) so large holdings aren't distorted by pool price impact.
 * Returns `undefined` when the asset isn't routable to USDT.
 */
export async function getUnitPriceUsd(
  asset: MoxitAsset
): Promise<number | undefined> {
  const assetIn = Number(hydration.getMetadataAssetId(pricingAsset(asset)));
  const assetOut = Number(hydration.getMetadataAssetId(usdt));
  if (assetIn === assetOut) return 1;

  const spot = await getRouter().getSpotPrice(assetIn, assetOut);
  if (!spot) return undefined;
  return Number(spot.amount) / 10 ** spot.decimals;
}

/** Format a USD amount as `$1,234.56`. */
export function formatUsd(value: number): string {
  return (
    '$' +
    value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
