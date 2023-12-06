import { SubstrateQueryConfig } from '@moonbeam-network/xcm-builder';
import { Asset, AssetAmount } from '@moonbeam-network/xcm-types';
import { QueryableStorage } from '@polkadot/api/types';

import { concatMap, map, switchMap, Observable, ReplaySubject } from 'rxjs';

import { SubstrateService } from '../../substrate';

import { BalanceProvider } from '../types';

export class SubstrateBalance implements BalanceProvider<SubstrateQueryConfig> {
  readonly #substrate: SubstrateService;

  constructor(substrate: SubstrateService) {
    this.#substrate = substrate;
  }

  async read(asset: Asset, config: SubstrateQueryConfig): Promise<AssetAmount> {
    const { module, func, args, transform } = config;
    const response = await this.#substrate.api.query[module][func](...args);
    const balance = await transform(response);
    const decimals = this.#substrate.getDecimals(asset);
    return AssetAmount.fromAsset(asset, {
      amount: balance,
      decimals: decimals,
    });
  }

  subscribe(
    asset: Asset,
    config: SubstrateQueryConfig,
  ): Observable<AssetAmount> {
    const subject = new ReplaySubject<QueryableStorage<'rxjs'>>(1);
    subject.next(this.#substrate.api.rx.query);

    const { module, func, args, transform } = config;
    return subject.pipe(
      switchMap((q) => q[module][func](...args)),
      concatMap((b) => transform(b)),
      map((balance) => {
        const decimals = this.#substrate.getDecimals(asset);
        return AssetAmount.fromAsset(asset, {
          amount: balance,
          decimals: decimals,
        });
      }),
    );
  }
}
