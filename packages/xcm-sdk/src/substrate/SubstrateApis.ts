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

  public async api(ws: string): Promise<ApiPromise> {
    const promise =
      this._cache.get(ws) ||
      ApiPromise.create({
        noInitWarn: true,
        provider: new WsProvider(ws),
      });

    this._cache.set(ws, promise);
    const api = await promise;
    await api.isReady;
    return api;
  }
}
