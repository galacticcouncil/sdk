import { ApiPromise, ApiRx } from '@polkadot/api';
import { ApiTypes, QueryableStorageEntry } from '@polkadot/api/types';
import { AnyTuple } from '@polkadot/types/types';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { StorageConfigNotFound, SubscriptionNotSupported } from '../errors';

export type StorageOptions = {
  api: ApiPromise | ApiRx;
  path: string;
  params: any[];
};

export class Storage<T> {
  readonly options: StorageOptions;
  private subject: ReplaySubject<T>;

  constructor(options: StorageOptions) {
    this.options = options;
    this.subject = new ReplaySubject<T>(1);
  }

  static create<T>(options: StorageOptions): Storage<T> {
    if (!options.path) throw new StorageConfigNotFound('path');
    return new Storage<T>(options);
  }

  public get observable() {
    this.subscribe();
    return this.subject.asObservable();
  }

  private async subscribeWithApiPromise() {
    const { api, params } = this.options;

    params.push((result: T) => this.subject.next(result));
    const func = this.getQuery(api);

    if (!func) return;

    func(...params);
  }

  private async subscribeWithApiRx() {
    const { api, params } = this.options;

    (api as ApiRx).isReady.subscribe(() => {
      const func = this.getQuery(api);

      if (!func) return;

      const storage = func(api, ...params);
      (storage as unknown as Observable<T>).pipe(tap((result) => this.subject.next(result))).subscribe();
    });
  }

  private getQuery(api: ApiPromise | ApiRx) {
    const { path } = this.options;

    const queryPath = path.split('.');
    return queryPath.reduce((acc, i) => acc[i], api) as any as QueryableStorageEntry<ApiTypes, AnyTuple>;
  }

  private subscribe() {
    const { api } = this.options;
    switch (api.type) {
      case 'promise':
        this.subscribeWithApiPromise();
        break;
      case 'rxjs':
        this.subscribeWithApiRx();
        break;
      default:
        throw new SubscriptionNotSupported(api.type);
    }
  }
}
