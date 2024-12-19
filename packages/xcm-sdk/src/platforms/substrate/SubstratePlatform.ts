import {
  AnyParachain,
  Asset,
  AssetAmount,
  CallType,
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

import { Platform, XCall } from '../types';
import { Dex } from '../../Dex';

export class SubstratePlatform
  implements Platform<ExtrinsicConfig, SubstrateQueryConfig>
{
  readonly #substrate: Promise<SubstrateService>;
  readonly #dex: Dex;

  constructor(chain: AnyParachain, dex: Dex) {
    this.#substrate = SubstrateService.create(chain);
    this.#dex = dex;
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
      // Can't estimate fee if transferMultiasset with no balance
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
   * Display native fee in user preferred fee payment asset (dex only)
   *
   * @param fee - native fee
   * @param feeBalance - native fee balance
   * @returns - fee in user preferred payment asset
   */
  private async exchangeFee(
    fee: bigint,
    feeBalance: AssetAmount
  ): Promise<bigint> {
    const { asset, decimals, chain } = await this.#substrate;
    if (chain.parachainId === this.#dex.chain.parachainId) {
      const amountIn = Number(fee) / 10 ** decimals;
      const assetIn = chain.getMetadataAssetId(asset);
      const assetOut = chain.getMetadataAssetId(feeBalance);

      if (assetIn !== assetOut) {
        const { amountOut } = await this.#dex.router.getBestSell(
          assetIn.toString(),
          assetOut.toString(),
          amountIn
        );
        return BigInt(amountOut.toNumber());
      }
    }
    return fee;
  }
}
