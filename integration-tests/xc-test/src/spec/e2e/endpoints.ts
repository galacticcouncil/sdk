/**
 * Endpoints the e2e forks connect to, overriding the ones in xc-cfg.
 *
 * forklift speaks only the new JSON-RPC spec, so a source endpoint must expose
 * `archive_v1_*` to be forkable at all — chopsticks used legacy RPC and didn't
 * care. In practice every *live* endpoint in xc-cfg now serves the full
 * archive_v1 set, so this list exists for two other reasons:
 *
 *  - Several of xc-cfg's endpoints are dead (hydration.dotters,
 *    bifrost.ibp, bifrost.dotters all fail DNS), and forklift has no
 *    "skip the broken one" behaviour — it just retries.
 *
 *  - A cold fork pulls the runtime's working set over ~330 *serial* storage
 *    round-trips, so warmup is essentially `rtt x 330`. Endpoint latency is
 *    the single biggest factor in how long this suite takes, so these are
 *    ordered fastest-first.
 *
 * Measured rtt at time of writing:
 *   polkadot   polkadot-rpc.n.dwellir.com        272ms   (rpc.polkadot.io: 583ms)
 *   assethub   asset-hub-polkadot-rpc.n.dwellir  264ms
 *   hydration  hydration-rpc.n.dwellir.com       204ms   (rpc.coke: 1215ms)
 *   bifrost    eu.bifrost-polkadot-rpc.liebi     108ms
 *
 * polkadot-asset-hub-rpc.polkadot.io is deliberately last: it rate-limits
 * (HTTP 429) under the reconnect storm forklift produces on a failed source,
 * and once it does, every retry against it fails too.
 */
export const ENDPOINTS: Record<string, string[]> = {
  polkadot: [
    'wss://polkadot-rpc.n.dwellir.com',
    'wss://rpc.polkadot.io',
    'wss://rpc-polkadot.luckyfriday.io',
  ],
  assethub: [
    'wss://asset-hub-polkadot-rpc.n.dwellir.com',
    'wss://rpc-asset-hub-polkadot.luckyfriday.io',
    'wss://polkadot-asset-hub-rpc.polkadot.io',
  ],
  hydration: [
    'wss://hydration-rpc.n.dwellir.com',
    'wss://hydration.rotko.net',
    'wss://rpc.coke.hydration.cloud',
    'wss://rpc.sin.hydration.cloud',
  ],
  bifrost: ['wss://eu.bifrost-polkadot-rpc.liebi.com/ws'],
};

export const endpointsFor = (key: string, fallback: string | string[]) =>
  ENDPOINTS[key] ?? fallback;
