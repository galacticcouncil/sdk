/**
 * Chopsticks fork presets. `endpoint` is the live chain to fork (first
 * reachable wins) — catfish first because it is dramatically faster than
 * dwellir for the lazy per-block state fetches that dominate fork block time.
 */
export interface ChainSpec {
  key: string;
  name: string;
  endpoint: string | string[];
  /** Fixed local chopsticks ws port (optional; chopsticks picks a free one). */
  port?: number;
  paraId: number;
}

export const hydration: ChainSpec = {
  key: 'hydration',
  name: 'Hydration',
  endpoint: [
    'wss://rpc-catfish-1.catfish.hydration.cloud',
    'wss://rpc-catfish-2.catfish.hydration.cloud',
  ],
  paraId: 2034,
};

export const configs = { hydration } as const;
