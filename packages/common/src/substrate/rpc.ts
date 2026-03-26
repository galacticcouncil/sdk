export function wsToHttp(url: string): string {
  return url.replace(/^(ws)(s)?:\/\//, (_, _insecure, secure) =>
    secure ? 'https://' : 'http://'
  );
}

/**
 * Detects whether an RPC endpoint requires legacy JSON-RPC mode.
 *
 * Checks two conditions:
 * 1. If `dev_newBlock` is present in `rpc_methods` (Chopsticks with partial/broken chainHead support)
 * 2. If `chainHead_v1_follow` is absent from `rpc_methods`
 */
const legacyCache = new Map<string, boolean>();

export async function detectLegacyRpc(
  httpUrl: string,
  signal?: AbortSignal
): Promise<boolean> {
  const cached = legacyCache.get(httpUrl);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(httpUrl, {
      signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'rpc_methods',
        params: [],
      }),
    });

    if (!res.ok) {
      return false;
    }

    const json = await res.json();
    const methods: string[] = json?.result?.methods ?? [];

    if (methods.includes('dev_newBlock')) {
      legacyCache.set(httpUrl, true);
      return true;
    }

    const isLegacy = !methods.includes('chainHead_v1_follow');
    legacyCache.set(httpUrl, isLegacy);
    return isLegacy;
  } catch {
    return false;
  }
}
