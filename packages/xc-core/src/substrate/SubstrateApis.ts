import { createClient, PolkadotClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider';
import { LRUCache } from 'lru-cache';

type WsProvider = ReturnType<typeof getWsProvider>;

interface CachedConnection {
  client: PolkadotClient;
  provider: WsProvider;
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

  public createClient(endpoints: string[]): PolkadotClient {
    const wsProvider = getWsProvider(endpoints);
    const client = createClient(wsProvider);

    const cacheKey = this.createCacheKey(endpoints);
    console.log(`Created PAPI client for ${cacheKey}`);

    const connection: CachedConnection = { client, provider: wsProvider };
    this._cache.set(cacheKey, connection, { noDisposeOnSet: true });

    return client;
  }

  public api(ws: string | string[]): PolkadotClient {
    const endpoints = typeof ws === 'string' ? ws.split(',') : ws;
    const cacheKey = this.findCacheKey(endpoints);

    if (cacheKey) {
      const connection = this._cache.get(cacheKey)!;
      return connection.client;
    }

    return this.createClient(endpoints);
  }

  public release() {
    const first = this._cache.entries().next().value;
    if (first) {
      const [key, connection] = first;
      console.log('Releasing ' + key);
      connection.client.destroy();
    }
    this._cache.clear();
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
