import { createClient, PolkadotClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider';
import { LRUCache } from 'lru-cache';
import { Observable, Subscription } from 'rxjs';

import { blockProbe$, BlockProbeConfig, ProbeState } from './probe';

type WsProvider = ReturnType<typeof getWsProvider>;

type ProbeFactory = (
  client: PolkadotClient,
  config?: BlockProbeConfig
) => Observable<ProbeState>;

export interface HealthProbeConfig extends BlockProbeConfig {
  enabled?: boolean;
  probe?: ProbeFactory;
}

interface CachedConnection {
  client: PolkadotClient;
  provider: WsProvider;
  endpoints: string[];
  currentEndpointIndex: number;
  probeSubscription?: Subscription;
}

export class SubstrateApis {
  private static _instance: SubstrateApis = new SubstrateApis();

  private _cache: LRUCache<string, CachedConnection> = new LRUCache<
    string,
    CachedConnection
  >({
    max: 40,
  });

  constructor() {
    if (SubstrateApis._instance) {
      throw new Error('Use SubstrateApis.getInstance() instead of new.');
    }
    SubstrateApis._instance = this;
  }

  public static getInstance(): SubstrateApis {
    return SubstrateApis._instance;
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
    probeConfig?: HealthProbeConfig
  ): PolkadotClient {
    const wsProvider = getWsProvider(endpoints);
    const client = createClient(wsProvider);

    const cacheKey = this.createCacheKey(endpoints);
    console.log(`Created PAPI client for ${cacheKey}`);

    const connection: CachedConnection = {
      client,
      provider: wsProvider,
      endpoints,
      currentEndpointIndex: 0,
    };
    this._cache.set(cacheKey, connection, { noDisposeOnSet: true });

    if (probeConfig?.enabled !== false) {
      this.startHealthProbe(connection, probeConfig);
    }

    return client;
  }

  public api(
    ws: string | string[],
    probeConfig?: HealthProbeConfig
  ): PolkadotClient {
    const endpoints = typeof ws === 'string' ? ws.split(',') : ws;
    const cacheKey = this.findCacheKey(endpoints);

    if (cacheKey) {
      const connection = this._cache.get(cacheKey)!;
      return connection.client;
    }

    return this.createClient(endpoints, probeConfig);
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
