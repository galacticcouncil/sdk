import {
  AnyParachain,
  Asset,
  AssetAmount,
  CallType,
  ExtrinsicConfig,
  SubstrateQueryConfig,
  SwapFactory,
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

import { SubstrateService } from './SubstrateService';
import { normalizeAssetAmount } from './utils';

import { Platform, XCall } from '../types';

export class SubstratePlatform
  implements Platform<ExtrinsicConfig, SubstrateQueryConfig>
{
  readonly #substrate: Promise<SubstrateService>;

  constructor(chain: AnyParachain) {
    this.#substrate = SubstrateService.create(chain);
  }

  async calldata(
    account: string,
    _amount: bigint,
    config: ExtrinsicConfig
  ): Promise<XCall> {
    const substrate = await this.#substrate;
    const extrinsic = substrate.getExtrinsic(config);
    return {
      from: account,
      data: extrinsic.toHex(),
      type: CallType.Substrate,
    } as XCall;
  }

  async estimateFee(
    account: string,
    _amount: bigint,
    feeBalance: AssetAmount,
    config: ExtrinsicConfig
  ): Promise<AssetAmount> {
    const substrate = await this.#substrate;
    let fee: bigint;
    try {
      fee = await substrate.estimateFee(account, config);
      fee = await this.exchangeFee(fee, feeBalance);
    } catch (e) {
      /**
       * Transaction PaymentApi_query_info panic for V3 or higher
       * multi-location versions if used for an extrinsic with empty
       * account (of transferred asset).
       */
      fee = 0n;
    }
    const params = normalizeAssetAmount(fee, feeBalance, substrate);
    return feeBalance.copyWith(params);
  }

  async getBalance(
    asset: Asset,
    config: SubstrateQueryConfig
  ): Promise<AssetAmount> {
    const ob = await this.subscribeBalance(asset, config);
    return firstValueFrom(ob);
  }

  async subscribeBalance(
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

  /**
   * Display native fee in user preferred fee payment asset
   *
   * Supported only if on-chain swap enabled
   *
   * @param fee - native fee
   * @param feeBalance - user preferred payment asset balance
   * @returns - fee in user preferred payment asset
   */
  private async exchangeFee(
    fee: bigint,
    feeBalance: AssetAmount
  ): Promise<bigint> {
    const { asset, decimals, chain } = await this.#substrate;

    if (asset.isEqual(feeBalance)) {
      return fee;
    }

    const swap = SwapFactory.getInstance().get(chain.key);
    if (swap) {
      const quote = await swap.getQuote(
        feeBalance,
        asset,
        AssetAmount.fromAsset(asset, { amount: fee, decimals })
      );
      return quote.amount;
    }
    return fee;
  }
}
