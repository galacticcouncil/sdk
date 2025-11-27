import {
  AnyParachain,
  Asset,
  AssetAmount,
  CallType,
  Dex,
  DexFactory,
  ExtrinsicConfig,
  SubstrateQueryConfig,
} from '@galacticcouncil/xcm2-core';

import {
  concatMap,
  distinctUntilChanged,
  firstValueFrom,
  Observable,
} from 'rxjs';

import { SubstrateService } from './SubstrateService';
import {
  getErrorFromDryRun,
  normalizeAssetAmount,
  toPascalCase,
} from './utils';
import { SubstrateCall, SubstrateDryRunResult } from './types';

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

    const extrinsic = await substrate.getExtrinsic(config);
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
              const extrinsic = substrate.getExtrinsic(config);
              const dryRunResult = await substrate.dryRun(account, extrinsic);

              const error =
                dryRunResult.execution_result &&
                !dryRunResult.execution_result.success
                  ? getErrorFromDryRun(dryRunResult.execution_result.value)
                  : undefined;

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

    const moduleName = toPascalCase(module);
    const funcName = toPascalCase(func);

    // Use unsafe API for dynamic queries
    const unsafeApi = substrate.client.getUnsafeApi();

    const queryModule = (unsafeApi.query as any)[moduleName];
    if (!queryModule) {
      throw new Error(
        `Query module "${module}" (${moduleName}) not found in runtime`
      );
    }

    const queryFunc = queryModule[funcName];
    if (!queryFunc) {
      throw new Error(
        `Query function "${func}" (${funcName}) not found in module "${moduleName}"`
      );
    }

    const observable$ = queryFunc.watchValue(...args);

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

    if (this.#dex) {
      const amount = AssetAmount.fromAsset(asset, { amount: fee, decimals });
      const quote = await this.#dex.getQuote(feeBalance, asset, amount, true);
      return quote.amount;
    }
    return fee;
  }
}
