import { SubstrateQueryConfig } from '@moonbeam-network/xcm-builder';
import { Asset, AssetAmount } from '@moonbeam-network/xcm-types';
import { QueryableStorage } from '@polkadot/api/types';

import {
  concatMap,
  distinctUntilChanged,
  firstValueFrom,
  map,
  switchMap,
  Observable,
  ReplaySubject,
} from 'rxjs';

import { SubstrateService, normalizeAssetAmount } from '../../substrate';

import { BalanceProvider } from '../types';

export class SubstrateBalance implements BalanceProvider<SubstrateQueryConfig> {
  readonly #substrate: SubstrateService;

  constructor(substrate: SubstrateService) {
    this.#substrate = substrate;
  }

  async read(asset: Asset, config: SubstrateQueryConfig): Promise<AssetAmount> {
    const ob = this.subscribe(asset, config);
    return firstValueFrom(ob);
  }

  subscribe(
    asset: Asset,
    config: SubstrateQueryConfig
  ): Observable<AssetAmount> {
    const subject = new ReplaySubject<QueryableStorage<'rxjs'>>(1);
    subject.next(this.#substrate.api.rx.query);

    const { module, func, args, transform } = config;
    return subject.pipe(
      switchMap((q) => q[module][func](...args)),
      concatMap((b) => transform(b)),
      distinctUntilChanged((prev, curr) => prev === curr),
      map((balance) => {
        const params = normalizeAssetAmount(balance, asset, this.#substrate);
        return AssetAmount.fromAsset(asset, params);
      })
    );
  }
}
