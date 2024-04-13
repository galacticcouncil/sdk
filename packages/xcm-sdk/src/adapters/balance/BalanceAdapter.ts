import {
  BaseConfig,
  CallType,
  ContractConfig,
  SubstrateQueryConfig,
} from '@moonbeam-network/xcm-builder';
import { Asset, AssetAmount } from '@moonbeam-network/xcm-types';

import { Observable } from 'rxjs';

import { EthereumBalance } from './EthereumBalance';
import { SubstrateBalance } from './SubstrateBalance';
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

  private ethereumBalance!: EthereumBalance;
  private substrateBalance: SubstrateBalance;

  constructor({ evmClient, substrate }: BalanceParams) {
    this.substrate = substrate;
    this.substrateBalance = new SubstrateBalance(substrate);

    if (evmClient) {
      this.evmClient = evmClient;
      this.ethereumBalance = new EthereumBalance(evmClient);
    }
  }

  async read(asset: Asset, config: BaseConfig): Promise<AssetAmount> {
    if (config.type === CallType.Evm) {
      const contract = EvmBalanceFactory.get(
        this.evmClient,
        config as ContractConfig
      );
      return this.ethereumBalance.read(asset, contract);
    }

    return this.substrateBalance.read(asset, config as SubstrateQueryConfig);
  }

  subscribe(asset: Asset, config: BaseConfig): Observable<AssetAmount> {
    if (config.type === CallType.Evm) {
      const contract = EvmBalanceFactory.get(
        this.evmClient,
        config as ContractConfig
      );
      return this.ethereumBalance.subscribe(asset, contract);
    }

    return this.substrateBalance.subscribe(
      asset,
      config as SubstrateQueryConfig
    );
  }
}
