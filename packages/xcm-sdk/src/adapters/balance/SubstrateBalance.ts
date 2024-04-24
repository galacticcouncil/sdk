import {
  AnyParachain,
  Asset,
  AssetAmount,
  SubstrateQueryConfig,
} from '@galacticcouncil/xcm-core';

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

import { BalanceProvider } from '../types';
import { SubstrateService, normalizeAssetAmount } from '../../substrate';

export class SubstrateBalance implements BalanceProvider<SubstrateQueryConfig> {
  readonly #substrate: Promise<SubstrateService>;

  constructor(chain: AnyParachain) {
    this.#substrate = SubstrateService.create(chain);
  }

  async read(asset: Asset, config: SubstrateQueryConfig): Promise<AssetAmount> {
    const ob = await this.subscribe(asset, config);
    return firstValueFrom(ob);
  }

  async subscribe(
    asset: Asset,
    config: SubstrateQueryConfig
  ): Promise<Observable<AssetAmount>> {
    const subject = new ReplaySubject<QueryableStorage<'rxjs'>>(1);
    const substrate = await this.#substrate;
    subject.next(substrate.api.rx.query);

    const { module, func, args, transform } = config;
    return subject.pipe(
      switchMap((q) => q[module][func](...args)),
      concatMap((b) => transform(b)),
      distinctUntilChanged((prev, curr) => prev === curr),
      map((balance) => {
        const params = normalizeAssetAmount(balance, asset, substrate);
        return AssetAmount.fromAsset(asset, params);
      })
    );
  }
}
