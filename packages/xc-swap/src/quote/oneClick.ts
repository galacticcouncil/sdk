import {
  OneClickService,
  OpenAPI,
  QuoteRequest,
  type QuoteResponse,
  type TokenResponse,
} from '@defuse-protocol/one-click-sdk-typescript';

import { ONE_CLICK_ORIGIN_ASSET } from '../registry/consts';

export interface OneClickConfig {
  baseUrl?: string;
  jwt?: string;
}

const DEFAULT_DISTRIBUTION_CHANNEL =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjIwMjUtMDEtMTItdjEifQ.eyJ2IjoxLCJrZXlfdHlwZSI6ImRpc3RyaWJ1dGlvbl9jaGFubmVsIiwicGFydG5lcl9pZCI6Imh5ZHJhdGlvbiIsImlhdCI6MTc4MTg3MjQzNywiZXhwIjoxODEzNDA4NDM3fQ.JOLeSM9F4PiyCCpT2xsoLm3hsS77hT4JjyNVxw_8PpENkIKsLFtSpTPUH6eN2cmSXtuAGiJ9UV44anBHL76j19uYvTqZaJNTDoRMB0oUd6WNKiaQJQXs2UmjYOOKNNvBlQU-i8H7bw5tN_yf-rzKuuj-VRNU6TcAhNDkhnWnFChFG4UTd-9V4Ktd5stAFX1VdaWDW9ueBQDkF-dcmrjXBlM44G2UTy3HP65XvzIhYpIRv_CusUkBTipk8nHnkdjXtFBuds2okzI875LLRzf8ANx3HBzdjZsuHbHeBLIPwZcueV2KkkfeEoa2bLRnaXS3IfIhY13N666wyeea0HvUvA';

/** Apply 1Click client configuration (base URL + optional JWT). */
export function configureOneClick(config: OneClickConfig = {}): void {
  if (config.baseUrl) OpenAPI.BASE = config.baseUrl;
  if (config.jwt) {
    OpenAPI.TOKEN = config.jwt;
  } else {
    OpenAPI.TOKEN = DEFAULT_DISTRIBUTION_CHANNEL;
  }
}

/** Fetch the 1Click token registry (`GET /v0/tokens`). */
export function fetchOneClickTokens(): Promise<TokenResponse[]> {
  return OneClickService.getTokens();
}

export interface OneClickQuoteParams {
  /** Net amount (smallest unit) that lands at the deposit address, post relay fee. */
  amount: bigint;
  /** Destination 1Click asset id (phase 1: nep141:wrap.near). */
  destinationAsset: string;
  /** Recipient on the destination chain. */
  recipient: string;
  /** Refund address on the origin chain. */
  refundTo: string;
  /** Slippage tolerance in basis points. */
  slippageBps: number;
  /** Quote deadline as a Unix timestamp (ms). */
  deadline: number;
  /** Origin asset entering the swap. Default native ETH on Ethereum. */
  originAsset?: string;
  /**
   * Dry run. `true` for estimation (no deposit address generated); `false` for
   * a firm, committed quote (returns the deposit address). Default `true`.
   */
  dry?: boolean;
}

/**
 * Request a 1Click quote for the ETH → destination leg, sized to the net that
 * lands at the deposit address. Uses `FLEX_INPUT` so the swap consumes whatever
 * actually arrives (the unspent relay-fee headroom is converted, not refunded),
 * matching `nirViaWtt.ts`.
 */
export async function getOneClickQuote(
  params: OneClickQuoteParams
): Promise<QuoteResponse> {
  const request: QuoteRequest = {
    dry: params.dry ?? true,
    swapType: QuoteRequest.swapType.FLEX_INPUT,
    slippageTolerance: params.slippageBps,
    originAsset: params.originAsset ?? ONE_CLICK_ORIGIN_ASSET,
    depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
    destinationAsset: params.destinationAsset,
    amount: params.amount.toString(),
    referral: 'hydration',
    refundTo: params.refundTo,
    refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
    recipient: params.recipient,
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    deadline: new Date(params.deadline).toISOString(),
  };

  return OneClickService.getQuote(request);
}
