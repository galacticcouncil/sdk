import { getAddress, isAddress, type Hex } from 'viem';

/** Timeout for quoter and scan requests, ms. */
const HTTP_TIMEOUT_MS = 30_000;

/**
 * Relay ceiling `C` the order commits to.
 *
 * - Quoter's estimate of the Ethereum delivery, with headroom
 * - Gas moves it several times a day: read at submission, never cache
 *
 * @param quoterUrl - quoter base url
 * @param marginBps - headroom over the estimate, bps
 */
export async function relayFeeCeiling(
  quoterUrl: string,
  marginBps: number
): Promise<bigint> {
  const res = await fetch(
    `${quoterUrl}/relay-fee?chain=ethereum&marginBps=${marginBps}`,
    { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) }
  );
  if (!res.ok) {
    throw new Error(`Relay fee quoter ${res.status}: ${await res.text()}`);
  }
  const { feeRequested } = (await res.json()) as { feeRequested: string };
  return BigInt(feeRequested);
}

/**
 * 1Click standing pass-through to `A`, as a backend returns it.
 *
 * - The partner key making it must stay server-side
 */
export interface PassThrough {
  /** Ethereum deposit address `0xN` */
  address: string;
  /** Intents account the quote delivers to */
  recipient: string;
  /** Intents account the quote refunds to */
  refundTo: string;
}

/** Makes or looks up the pass-through to an intents account. */
export type PassThroughProvider = (account: string) => Promise<PassThrough>;

/**
 * Deposit address of a pass-through, once it is shown to forward to `A`.
 *
 * - Nothing on-chain binds `0xN` to the terms, so the quote is checked here
 *
 * @param passThrough - quote from the backend
 * @param account - deposit account `A`
 * @throws when the quote names another account or no address
 */
export function depositAddressOf(
  passThrough: PassThrough,
  account: string
): Hex {
  if (passThrough.recipient !== account || passThrough.refundTo !== account) {
    throw new Error(
      `Pass-through does not forward to ${account}: recipient ${passThrough.recipient}, refund ${passThrough.refundTo}`
    );
  }
  if (!isAddress(passThrough.address, { strict: false })) {
    throw new Error(
      `Pass-through address is no EVM address: ${passThrough.address}`
    );
  }
  return getAddress(passThrough.address) as Hex;
}
