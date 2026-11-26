import type { Hex } from 'viem';

import { decodeTerms } from './terms/codec';
import type { Terms } from './terms/types';

/** Trade status as scan reports it. */
export type TradeStatus =
  | 'pending'
  | 'closing'
  | 'completed'
  | 'refunded'
  | 'expired';

/** One trade from scan: its terms, orders and payouts. */
export interface ScanTrade {
  trade: {
    auth_path: string;
    /** Packed terms, hex */
    terms: string;
    status: TradeStatus;
    [key: string]: unknown;
  };
  orders: Record<string, unknown>[];
  payouts: Record<string, unknown>[];
}

/**
 * One trade, or undefined when scan does not know it.
 *
 * @param scanUrl - scan API base url
 * @param authPath - terms' path
 */
export async function fetchTrade(
  scanUrl: string,
  authPath: string
): Promise<ScanTrade | undefined> {
  const res = await fetch(`${scanUrl}/trades/${authPath.toLowerCase()}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (res.status === 404) return undefined;
  if (!res.ok) {
    throw new Error(`Scan ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as ScanTrade;
}

/**
 * Terms of a scanned trade — what `close` needs when they weren't kept.
 *
 * @param trade - trade from {@link fetchTrade}
 */
export function termsFromTrade(trade: ScanTrade): Terms {
  return decodeTerms(trade.trade.terms as Hex);
}
