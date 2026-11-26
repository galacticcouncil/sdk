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
