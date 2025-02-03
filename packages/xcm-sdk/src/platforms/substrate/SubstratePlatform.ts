import {
  AnyParachain,
  Asset,
  AssetAmount,
  CallType,
  Dex,
  DexFactory,
  ExtrinsicConfig,
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

import { SubstrateService } from './SubstrateService';
import { normalizeAssetAmount } from './utils';
import { SubstrateCall } from './types';

import { Platform } from '../types';

export class SubstratePlatform
  implements Platform<ExtrinsicConfig, SubstrateQueryConfig>
{
  readonly #substrate: Promise<SubstrateService>;
  readonly #dex: Dex | undefined;

  constructor(chain: AnyParachain) {
    this.#substrate = SubstrateService.create(chain);
    this.#dex = DexFactory.getInstance().get(chain.key);
  }

  private async useSignerFee(fee: Asset) {
    const substrate = await this.#substrate;
    return substrate.chain.usesSignerFee && !substrate.asset.isEqual(fee);
  }

  async calldata(
    account: string,
    _amount: bigint,
    feeBalance: AssetAmount,
    config: ExtrinsicConfig
  ): Promise<SubstrateCall> {
    const substrate = await this.#substrate;
    const useSignerFee = await this.useSignerFee(feeBalance);

    const txOptions = useSignerFee
      ? {
          asset: new Asset(feeBalance),
        }
      : undefined;

    const extrinsic = substrate.getExtrinsic(config);
    return {
      from: account,
      data: extrinsic.toHex(),
      type: CallType.Substrate,
      txOptions: txOptions,
    } as SubstrateCall;
  }

  async estimateFee(
    account: string,
    _amount: bigint,
    feeBalance: AssetAmount,
    config: ExtrinsicConfig
  ): Promise<AssetAmount> {
    const substrate = await this.#substrate;
    const networkFee = await substrate.estimateNetworkFee(account, config);
    const deliveryFee = await substrate.estimateDeliveryFee(account, config);
    const fee = await this.exchangeFee(networkFee + deliveryFee, feeBalance);
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
   * Supported only if on-chain swap enabled (dex support)
   *
   * @param fee - native fee
   * @param feeBalance - user preferred payment asset balance
   * @returns - fee in user preferred payment asset
   */
  private async exchangeFee(
    fee: bigint,
    feeBalance: AssetAmount
  ): Promise<bigint> {
    const { asset, decimals } = await this.#substrate;

    if (asset.isEqual(feeBalance)) {
      return fee;
    }

    if (this.#dex) {
      const quote = await this.#dex.getQuote(
        feeBalance,
        asset,
        AssetAmount.fromAsset(asset, { amount: fee, decimals })
      );
      return quote.amount;
    }
    return fee;
  }
}
