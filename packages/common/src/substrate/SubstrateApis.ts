import { createClient, PolkadotClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider';
import { LRUCache } from 'lru-cache';

import { blockProbe$, HealthProbeConfig, ProbeState } from './probe';

export interface MetadataCache {
  getMetadata: (codeHash: string) => Promise<Uint8Array | null>;
  setMetadata: (codeHash: string, metadata: Uint8Array) => void;
}

type WsProvider = ReturnType<typeof getWsProvider>;

export type WsProviderOpts = Parameters<typeof getWsProvider>[1];

export interface ApiOptions {
  wsProviderOpts?: WsProviderOpts;
  probeConfig?: HealthProbeConfig;
}

interface CachedConnection {
  client: PolkadotClient;
  provider: WsProvider;
  endpoints: string[];
  currentEndpointIndex: number;
  probeSubscription?: { unsubscribe: () => void };
}

export class SubstrateApis {
  private static _instance: SubstrateApis = new SubstrateApis();

  private _cache: LRUCache<string, CachedConnection> = new LRUCache<
    string,
    CachedConnection
  >({
    max: 40,
  });

  private _metadataCache?: MetadataCache;

  constructor() {
    if (SubstrateApis._instance) {
      throw new Error('Use SubstrateApis.getInstance() instead of new.');
    }
    SubstrateApis._instance = this;
  }

  public static getInstance(): SubstrateApis {
    return SubstrateApis._instance;
  }

  public configureMetadataCache(cache: MetadataCache): void {
    this._metadataCache = cache;
  }

  public createCacheKey(endpoints: string[]) {
    return endpoints.join(',');
  }

  public findCacheKey(endpoints: string[]) {
    const cacheKey = endpoints.find((key) => this._cache.has(key));

    if (cacheKey) {
      return cacheKey;
    }

    const compositeCacheKey = this.createCacheKey(endpoints);
    return this._cache.has(compositeCacheKey) ? compositeCacheKey : null;
  }

  public createClient(
    endpoints: string[],
    opts?: ApiOptions
  ): PolkadotClient {
    const wsProvider = getWsProvider(endpoints, opts?.wsProviderOpts);
    const client = createClient(
      wsProvider,
      this._metadataCache
        ? {
            getMetadata: this._metadataCache.getMetadata,
            setMetadata: this._metadataCache.setMetadata,
          }
        : undefined
    );

    const cacheKey = this.createCacheKey(endpoints);
    console.log(`Created PAPI client for ${cacheKey}`);

    const connection: CachedConnection = {
      client,
      provider: wsProvider,
      endpoints,
      currentEndpointIndex: 0,
    };
    this._cache.set(cacheKey, connection, { noDisposeOnSet: true });

    if (opts?.probeConfig?.enabled !== false) {
      this.startHealthProbe(connection, opts?.probeConfig);
    }

    return client;
  }

  public api(
    ws: string | string[],
    opts?: ApiOptions
  ): PolkadotClient {
    const endpoints = typeof ws === 'string' ? ws.split(',') : ws;
    const cacheKey = this.findCacheKey(endpoints);

    if (cacheKey) {
      const connection = this._cache.get(cacheKey)!;
      return connection.client;
    }

    return this.createClient(endpoints, opts);
  }

  public release() {
    for (const [key, connection] of this._cache.entries()) {
      this.stopHealthProbe(connection);
      console.log('Releasing ' + key);
      connection.client.destroy();
    }
    this._cache.clear();
  }

  public configureHealthProbe(
    ws: string | string[],
    config: HealthProbeConfig
  ): void {
    const endpoints = typeof ws === 'string' ? ws.split(',') : ws;
    const cacheKey = this.findCacheKey(endpoints);

    if (cacheKey) {
      const connection = this._cache.get(cacheKey)!;
      this.stopHealthProbe(connection);
      if (config.enabled !== false) {
        this.startHealthProbe(connection, config);
      }
    }
  }

  private startHealthProbe(
    connection: CachedConnection,
    config: HealthProbeConfig = {}
  ): void {
    const probeFactory = config.probe ?? blockProbe$;

    const switchEndpoint = (reason: string) => {
      if (connection.endpoints.length > 1) {
        const nextIndex =
          (connection.currentEndpointIndex + 1) % connection.endpoints.length;
        const nextEndpoint = connection.endpoints[nextIndex];

        console.log(
          `${reason} on ${connection.endpoints[connection.currentEndpointIndex]}, switching to ${nextEndpoint}`
        );
        connection.provider.switch(nextEndpoint);
        connection.currentEndpointIndex = nextIndex;

        // Restart probe with fresh state after switch
        this.stopHealthProbe(connection);
        this.startHealthProbe(connection, config);
      }
    };

    connection.probeSubscription = probeFactory(
      connection.client,
      config
    ).subscribe({
      next: (state: ProbeState) => {
        if (state === 'stale') {
          switchEndpoint('RPC stale');
        }
      },
    });
  }

  private stopHealthProbe(connection: CachedConnection): void {
    if (connection.probeSubscription) {
      connection.probeSubscription.unsubscribe();
      connection.probeSubscription = undefined;
    }
  }

  public getWs(ws: string | string[]): WsProvider | undefined {
    const endpoints = typeof ws === 'string' ? ws.split(',') : ws;
    const cacheKey = this.findCacheKey(endpoints);

    if (!cacheKey) {
      return undefined;
    }

    return this._cache.get(cacheKey)?.provider;
  }
}
