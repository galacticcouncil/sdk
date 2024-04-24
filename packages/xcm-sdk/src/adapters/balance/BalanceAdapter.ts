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

import { ContractBalance } from './ContractBalance';
import { SubstrateBalance } from './SubstrateBalance';

import { BalanceProvider } from '../types';

export class BalanceAdapter {
  private readonly providers: Record<string, BalanceProvider<BaseConfig>> = {};

  constructor(chain: AnyChain) {
    switch (chain.getType()) {
      case ChainType.EvmChain:
        this.providers.Evm = new ContractBalance(chain as EvmChain);
        break;
      case ChainType.EvmParachain:
        this.providers.Evm = new ContractBalance(chain as EvmParachain);
        this.providers.Substrate = new SubstrateBalance(chain as EvmParachain);
        break;
      case ChainType.Parachain:
        this.providers.Substrate = new SubstrateBalance(chain as Parachain);
        break;
      default:
        throw new Error('Unknown chain type');
    }
  }

  async read(asset: Asset, config: BaseConfig): Promise<AssetAmount> {
    return this.providers[config.type].read(asset, config);
  }

  async subscribe(
    asset: Asset,
    config: BaseConfig
  ): Promise<Observable<AssetAmount>> {
    return this.providers[config.type].subscribe(asset, config);
  }
}
