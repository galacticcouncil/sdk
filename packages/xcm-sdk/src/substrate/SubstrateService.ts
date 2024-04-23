import '@polkadot/api-augment';

import {
  AnyParachain,
  Asset,
  AssetAmount,
  ConfigService,
  ExtrinsicConfig,
} from '@galacticcouncil/xcm-core';
import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

import { SubstrateApis } from './SubstrateApis';

export class SubstrateService {
  readonly api: ApiPromise;

  readonly chain: AnyParachain;

  readonly config: ConfigService;

  constructor(api: ApiPromise, chain: AnyParachain, config: ConfigService) {
    this.api = api;
    this.chain = chain;
    this.config = config;
  }

  static async create(
    chain: AnyParachain,
    configService: ConfigService
  ): Promise<SubstrateService> {
    const apiPool = SubstrateApis.getInstance();
    const api = await apiPool.api(chain.ws);
    return new SubstrateService(api, chain, configService);
  }

  get asset(): Asset {
    const nativeToken = this.api.registry.chainTokens[0];
    const nativeTokenKey = nativeToken.toLowerCase();
    const asset = this.config.getAsset(nativeTokenKey);
    if (!asset) {
      throw new Error(`No asset found for key "${nativeTokenKey}"`);
    }
    return asset;
  }

  get decimals(): number {
    return this.api.registry.chainDecimals[0];
  }

  get existentialDeposit(): AssetAmount {
    let ed;
    try {
      ed = this.api.consts.balances.existentialDeposit.toBigInt();
    } catch {
      ed = 0n;
    }
    return AssetAmount.fromAsset(this.asset, {
      amount: ed,
      decimals: this.decimals,
    });
  }

  getDecimals(asset: Asset): number {
    return this.chain.getAssetDecimals(asset) || this.decimals;
  }

  getExtrinsic(config: ExtrinsicConfig): SubmittableExtrinsic {
    const fn = this.api.tx[config.module][config.func];
    const args = config.getArgs(fn);

    if (args.length > 1 && config.func === 'batchAll') {
      const calls = args.map(({ module, func, getArgs }) => {
        const fn = this.api.tx[module][func];
        const args = getArgs(fn);
        return fn(...args);
      });
      return fn(calls);
    }
    return fn(...args);
  }

  async getFee(account: string, config: ExtrinsicConfig): Promise<bigint> {
    const extrinsic = this.getExtrinsic(config);
    const info = await extrinsic.paymentInfo(account, { nonce: -1 });
    return info.partialFee.toBigInt();
  }
}
