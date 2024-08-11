import { ApiPromise, WsProvider } from '@polkadot/api';
import { LRUCache } from 'lru-cache';

export class SubstrateApis {
  private static _instance: SubstrateApis = new SubstrateApis();

  private dispose = async (promise: Promise<ApiPromise>, key: string) => {
    const api = await promise;
    console.log('Releasing ' + key + ' connection');
    if (api.isConnected) {
      api.disconnect();
    }
  };

  private _cache: LRUCache<string, Promise<ApiPromise>> = new LRUCache<
    string,
    Promise<ApiPromise>
  >({
    max: 20,
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

  public async getPromise(
    endpoints: string[],
    maxRetries?: number
  ): Promise<ApiPromise> {
    let currentRetry = 0;

    return new Promise((resolve) => {
      const provider = new WsProvider(endpoints);
      provider.on('connected', async () => {
        const promise = ApiPromise.create({
          provider,
          noInitWarn: true,
        });

        console.log(`Connected to ${provider.endpoint}.`);
        this._cache.set(provider.endpoint, promise, { noDisposeOnSet: true });
        resolve(promise);
      });
      provider.on('error', async () => {
        currentRetry++;
        console.log(`Could not connect to ${provider.endpoint}, skipping...`);
        if (maxRetries && currentRetry >= maxRetries) {
          this._cache.delete(provider.endpoint);
          provider.disconnect();
        }
      });
    });
  }

  public async api(
    ws: string | string[],
    maxRetries?: number
  ): Promise<ApiPromise> {
    const endpoints = typeof ws === 'string' ? ws.split(',') : ws;
    const cacheKey = this.findCacheKey(endpoints);

    let promise: Promise<ApiPromise>;

    if (cacheKey) {
      promise = this._cache.get(cacheKey)!;
    } else {
      promise = this.getPromise(endpoints, maxRetries);
      this._cache.set(this.createCacheKey(endpoints), promise, {
        noDisposeOnSet: true,
      });
    }

    const api = await promise;
    await api.isReady;
    return api;
  }
}
