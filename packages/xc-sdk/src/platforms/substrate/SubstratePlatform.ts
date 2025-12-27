import {
  AnyParachain,
  Asset,
  AssetAmount,
  CallType,
  ExtrinsicConfig,
  SubstrateQueryConfig,
} from '@galacticcouncil/xc-core';

import {
  concatMap,
  catchError,
  distinctUntilChanged,
  firstValueFrom,
  throwError,
  Observable,
} from 'rxjs';

import { SubstrateService } from './SubstrateService';
import { getErrorFromDryRun, normalizeAssetAmount } from './utils';
import { SubstrateCall, SubstrateDryRunResult } from './types';

import { Platform } from '../types';

export class SubstratePlatform implements Platform<
  ExtrinsicConfig,
  SubstrateQueryConfig
> {
  readonly #substrate: Promise<SubstrateService>;

  constructor(chain: AnyParachain) {
    this.#substrate = SubstrateService.create(chain);
  }

  private async useSignerFee(fee: Asset) {
    const substrate = await this.#substrate;
    const asset = await substrate.getAsset();
    return substrate.chain.usesSignerFee && !asset.isEqual(fee);
  }

  async buildCall(
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

    const extrinsic = config.getTx(substrate.client);
    const extrinsicCall = config.module + '.' + config.func;

    const callData = await extrinsic.getEncodedData();

    return {
      from: account,
      data: callData.asHex(),
      type: CallType.Substrate,
      txOptions: txOptions,
      dryRun: substrate.isDryRunSupported()
        ? async () => {
            try {
              const extrinsic = config.getTx(substrate.client);
              const dryRunResult = await substrate.dryRun(account, extrinsic);

              const error =
                dryRunResult.execution_result &&
                dryRunResult.execution_result.success
                  ? undefined
                  : getErrorFromDryRun(dryRunResult.execution_result);

              return {
                call: extrinsicCall,
                error: error,
                events: dryRunResult.emitted_events || [],
                xcm: dryRunResult.forwarded_xcms || [],
              } as SubstrateDryRunResult;
            } catch (e) {
              return {
                call: extrinsicCall,
                error: e instanceof Error ? e.message : 'unknown',
              } as SubstrateDryRunResult;
            }
          }
        : () => {},
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
    const params = await normalizeAssetAmount(fee, feeBalance, substrate);
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
    const substrate = await this.#substrate;
    const { module, func, args, transform } = config;

    const fn = substrate.client.getUnsafeApi().query[module][func];
    const observable$ = fn.watchValue(...args);

    return observable$.pipe(
      concatMap((b: any) => transform(b)),
      distinctUntilChanged((prev, curr) => prev === curr),
      concatMap(async (balance) => {
        const params = await normalizeAssetAmount(
          balance as bigint,
          asset,
          substrate
        );
        return AssetAmount.fromAsset(asset, params);
      }),
      catchError((err) => {
        console.error('subscribe fails for:', asset);
        return throwError(() => err);
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
    const substrate = await this.#substrate;
    const asset = await substrate.getAsset();
    const decimals = await substrate.getDecimals();

    if (asset.isEqual(feeBalance)) {
      return fee;
    }

    try {
      const dex = substrate.chain.dex;
      const amount = AssetAmount.fromAsset(asset, { amount: fee, decimals });
      const quote = await dex.getQuote(feeBalance, asset, amount, true);
      return quote.amount;
    } catch {}
    return fee;
  }
}
