import { createClient, PolkadotClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider';
import { LRUCache } from 'lru-cache';

export class SubstrateApis {
  private static _instance: SubstrateApis = new SubstrateApis();

  private dispose = (client: PolkadotClient, key: string) => {
    console.log('Releasing ' + key + ' connection');
    client.destroy();
  };

  private _cache: LRUCache<string, PolkadotClient> = new LRUCache<
    string,
    PolkadotClient
  >({
    max: 40,
    dispose: this.dispose,
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
    this._cache.set(cacheKey, client, { noDisposeOnSet: true });

    return client;
  }

  public api(ws: string | string[]): PolkadotClient {
    const endpoints = typeof ws === 'string' ? ws.split(',') : ws;
    const cacheKey = this.findCacheKey(endpoints);

    if (cacheKey) {
      return this._cache.get(cacheKey)!;
    }

    return this.createClient(endpoints);
  }

  public release() {
    for (const [key, client] of this._cache.entries()) {
      console.log('Disconnecting from ' + key);
      client.destroy();
    }
    this._cache.clear();
  }
}
