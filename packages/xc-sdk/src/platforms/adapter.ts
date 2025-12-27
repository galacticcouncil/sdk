import {
  AnyChain,
  AnyEvmChain,
  Asset,
  AssetAmount,
  BaseConfig,
  ChainType,
  Parachain,
  SolanaChain,
  SuiChain,
} from '@galacticcouncil/xc-core';

import { Observable } from 'rxjs';

import { EvmPlatform } from './evm';
import { SolanaPlatform } from './solana';
import { SubstratePlatform } from './substrate';
import { SuiPlatform } from './sui';
import { Call, Platform } from './types';

export class PlatformAdapter {
  readonly platform: Record<string, Platform<BaseConfig, BaseConfig>> = {};

  constructor(chain: AnyChain) {
    switch (chain.getType()) {
      case ChainType.EvmChain:
        this.registerEvm(chain);
        break;
      case ChainType.EvmParachain:
        this.registerEvm(chain);
        this.registerSubstrate(chain);
        break;
      case ChainType.Parachain:
        this.registerSubstrate(chain);
        break;
      case ChainType.SolanaChain:
        this.registerSolana(chain);
        break;
      case ChainType.SuiChain:
        this.registerSui(chain);
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

  private registerSui(chain: AnyChain) {
    const suiChain = chain as SuiChain;
    this.platform.Sui = new SuiPlatform(suiChain);
  }

  private registerSubstrate(chain: AnyChain) {
    const parachain = chain as Parachain;
    this.platform.Substrate = new SubstratePlatform(parachain);
  }

  async buildCall(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: BaseConfig
  ): Promise<Call> {
    return this.platform[config.type].buildCall(
      account,
      amount,
      feeBalance,
      config
    );
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
