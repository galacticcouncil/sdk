import {
  DEFAULT_QUOTER_URL,
  DEFAULT_RELAY_MARGIN_PCT,
  pctToBps,
} from '../registry/consts';

export interface RelayFeeParams {
  /** Quoter base URL. Default the play quoter. */
  quoterUrl?: string;
  /** Destination chain for the relay leg. Default 'ethereum'. */
  chain?: string;
  /** Fee margin in basis points (the quoter's unit). Default 2000 (20%). */
  marginBps?: number;
}

/**
 * Query the relay-fee ceiling (`maxRelayFee`) from the quoter — gas-based and
 * independent of the swap. Mirrors `nirViaWtt.ts`:
 *   GET {quoter}/relay-fee?chain=<chain>&marginBps=<n> -> { feeRequested }
 */
export async function fetchMaxRelayFee(
  params: RelayFeeParams = {}
): Promise<bigint> {
  const quoterUrl = params.quoterUrl ?? DEFAULT_QUOTER_URL;
  const chain = params.chain ?? 'ethereum';
  const marginBps = params.marginBps ?? pctToBps(DEFAULT_RELAY_MARGIN_PCT);

  const url = `${quoterUrl}/relay-fee?chain=${chain}&marginBps=${marginBps}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`relay-fee quoter ${res.status}: ${await res.text()}`);
  }
  const { feeRequested } = (await res.json()) as { feeRequested: string };
  return BigInt(feeRequested);
}
