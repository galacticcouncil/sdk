import { XcSwapClient } from './client';
import type { XcSwapOpts } from './types';

/**
 * Create a cross-chain swap client.
 *
 * The caller owns the connection lifecycle: pass an already-constructed
 * `sdk-next` `TradeRouter` and the supported Hydration assets (e.g. from
 * `client.AssetClient.getSupported()`), plus the `IntentEmitter` proxy address
 * deployed on Hydration EVM.
 */
export function createXcSwap(opts: XcSwapOpts): XcSwapClient {
  return new XcSwapClient(opts);
}
