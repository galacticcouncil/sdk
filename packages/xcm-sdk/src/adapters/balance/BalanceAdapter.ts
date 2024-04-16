import {
  BaseConfig,
  CallType,
  ContractConfig,
  SubstrateQueryConfig,
} from '@moonbeam-network/xcm-builder';
import { Asset, AssetAmount } from '@moonbeam-network/xcm-types';

import { Observable } from 'rxjs';

import { EvmBalanceProvider } from './EvmBalanceProvider';
import { SubstrateBalanceProvider } from './SubstrateBalanceProvider';
import { EvmBalanceFactory } from './evm';

import { EvmClient } from '../../evm';
import { SubstrateService } from '../../substrate';

export type BalanceParams = {
  evmClient?: EvmClient;
  substrate: SubstrateService;
};

export class BalanceAdapter {
  protected evmClient!: EvmClient;
  protected substrate: SubstrateService;

  private substrateProvider: SubstrateBalanceProvider;
  private evmProvider!: EvmBalanceProvider;

  constructor({ evmClient, substrate }: BalanceParams) {
    this.substrate = substrate;
    this.substrateProvider = new SubstrateBalanceProvider(substrate);

    if (evmClient) {
      this.evmClient = evmClient;
      this.evmProvider = new EvmBalanceProvider(evmClient);
    }
  }

  async read(asset: Asset, config: BaseConfig): Promise<AssetAmount> {
    if (config.type === CallType.Evm) {
      const contract = EvmBalanceFactory.get(
        this.evmClient,
        config as ContractConfig
      );
      return this.evmProvider.read(asset, contract);
    }

    return this.substrateProvider.read(asset, config as SubstrateQueryConfig);
  }

  subscribe(asset: Asset, config: BaseConfig): Observable<AssetAmount> {
    if (config.type === CallType.Evm) {
      const contract = EvmBalanceFactory.get(
        this.evmClient,
        config as ContractConfig
      );
      return this.evmProvider.subscribe(asset, contract);
    }

    return this.substrateProvider.subscribe(
      asset,
      config as SubstrateQueryConfig
    );
  }
}
