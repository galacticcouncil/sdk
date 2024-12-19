import {
  AnyChain,
  Asset,
  AssetAmount,
  BaseConfig,
  ChainType,
  EvmChain,
  EvmParachain,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { Observable } from 'rxjs';

import { EvmPlatform } from './evm';
import { SubstratePlatform } from './substrate';
import { Platform, XCall } from './types';

import { Dex } from '../Dex';

export class PlatformAdapter {
  private readonly platform: Record<string, Platform<BaseConfig, BaseConfig>> =
    {};

  constructor(chain: AnyChain, dex: Dex) {
    switch (chain.getType()) {
      case ChainType.EvmChain:
        const evmChain = chain as EvmChain;
        this.platform.Evm = new EvmPlatform(evmChain);
        break;
      case ChainType.EvmParachain:
        const evmParachain = chain as EvmParachain;
        this.platform.Evm = new EvmPlatform(evmParachain);
        this.platform.Substrate = new SubstratePlatform(evmParachain, dex);
        break;
      case ChainType.Parachain:
        const parachain = chain as Parachain;
        this.platform.Substrate = new SubstratePlatform(parachain, dex);
        break;
      default:
        throw new Error('Unsupported platform:' + chain.getType());
    }
  }

  async calldata(
    account: string,
    amount: bigint,
    config: BaseConfig
  ): Promise<XCall> {
    return this.platform[config.type].calldata(account, amount, config);
  }

  async estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: BaseConfig
  ): Promise<AssetAmount> {
    return this.platform[config.type].estimateFee(
      account,
      amount,
      feeBalance,
      config
    );
  }

  async getBalance(asset: Asset, config: BaseConfig): Promise<AssetAmount> {
    return this.platform[config.type].getBalance(asset, config);
  }

  async subscribeBalance(
    asset: Asset,
    config: BaseConfig
  ): Promise<Observable<AssetAmount>> {
    return this.platform[config.type].subscribeBalance(asset, config);
  }
}
