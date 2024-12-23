import {
  AnyChain,
  AnyEvmChain,
  Asset,
  AssetAmount,
  BaseConfig,
  ChainType,
  Parachain,
  SolanaChain,
} from '@galacticcouncil/xcm-core';

import { Observable } from 'rxjs';

import { EvmPlatform } from './evm';
import { SolanaPlatform } from './solana';
import { SubstratePlatform } from './substrate';
import { Platform, XCall } from './types';

import { Dex } from '../Dex';

export class PlatformAdapter {
  private readonly platform: Record<string, Platform<BaseConfig, BaseConfig>> =
    {};

  constructor(chain: AnyChain, dex: Dex) {
    switch (chain.getType()) {
      case ChainType.EvmChain:
        this.registerEvm(chain);
        break;
      case ChainType.EvmParachain:
        this.registerEvm(chain);
        this.registerSubstrate(chain, dex);
        break;
      case ChainType.Parachain:
        this.registerSubstrate(chain, dex);
        break;
      case ChainType.SolanaChain:
        this.registerSolana(chain);
        break;
      default:
        throw new Error('Unsupported platform: ' + chain.getType());
    }
  }

  private registerEvm(chain: AnyChain) {
    const evmChain = chain as AnyEvmChain;
    this.platform.Evm = new EvmPlatform(evmChain);
  }

  private registerSolana(chain: AnyChain) {
    const solanaChain = chain as SolanaChain;
    this.platform.Solana = new SolanaPlatform(solanaChain);
  }

  private registerSubstrate(chain: AnyChain, dex: Dex) {
    const parachain = chain as Parachain;
    this.platform.Substrate = new SubstratePlatform(parachain, dex);
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
