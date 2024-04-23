import { Asset, AssetAmount, BaseConfig } from '@galacticcouncil/xcm-core';

import { Observable } from 'rxjs';

import { ContractBalance } from './ContractBalance';
import { SubstrateBalance } from './SubstrateBalance';

import { BalanceProvider } from '../types';
import { EvmClient } from '../../evm';
import { SubstrateService } from '../../substrate';

export type BalanceParams = {
  substrate: SubstrateService;
  evmClient?: EvmClient;
};

export class BalanceAdapter {
  private readonly providers: Record<string, BalanceProvider<BaseConfig>> = {};

  constructor({ substrate, evmClient }: BalanceParams) {
    this.providers.Substrate = new SubstrateBalance(substrate);
    if (evmClient) {
      this.providers.Evm = new ContractBalance(evmClient);
    }
  }

  async read(asset: Asset, config: BaseConfig): Promise<AssetAmount> {
    return this.providers[config.type].read(asset, config);
  }

  subscribe(asset: Asset, config: BaseConfig): Observable<AssetAmount> {
    return this.providers[config.type].subscribe(asset, config);
  }
}
