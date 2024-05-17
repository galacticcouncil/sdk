import { ApiPromise, WsProvider } from '@polkadot/api';
import { LRUCache } from '@thi.ng/cache';

export class SubstrateApis {
  private static _instance: SubstrateApis = new SubstrateApis();

  private _cache: LRUCache<string, Promise<ApiPromise>> = new LRUCache<
    string,
    Promise<ApiPromise>
  >(null, {
    maxlen: 20,
    release: (chain: string, promise: Promise<ApiPromise>) => {
      console.log('Releasing ' + chain + ' connection');
      promise.then((api: ApiPromise) => {
        if (api.isConnected) {
          api.disconnect();
        }
      });
    },
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

  public async getPromise(endpoints: string[]): Promise<ApiPromise> {
    return new Promise((resolve) => {
      const provider = new WsProvider(endpoints);
      provider.on('connected', async () => {
        const promise = ApiPromise.create({
          provider,
          noInitWarn: true,
        });

        console.log(`Connected to ${provider.endpoint}.`);
        this._cache.set(provider.endpoint, promise);
        resolve(promise);
      });
      provider.on('error', async () => {
        console.log(`Could not connect to ${provider.endpoint}, skipping.`);
        this._cache.delete(provider.endpoint);
      });
    });
  }

  public async api(ws: string | string[]): Promise<ApiPromise> {
    const endpoints = typeof ws === 'string' ? ws.split(',') : ws;

    const cacheKey = this.findCacheKey(endpoints);

    let promise: Promise<ApiPromise>;

    if (cacheKey) {
      promise = this._cache.get(cacheKey);
    } else {
      promise = this.getPromise(endpoints);
      this._cache.set(this.createCacheKey(endpoints), promise);
    }

    const api = await promise;
    await api.isReady;
    return api;
  }
}
