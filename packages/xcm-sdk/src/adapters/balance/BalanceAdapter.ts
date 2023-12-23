import {
  BaseConfig,
  CallType,
  ContractConfig,
  SubstrateQueryConfig,
} from '@moonbeam-network/xcm-builder';
import { Asset, AssetAmount } from '@moonbeam-network/xcm-types';

import { Observable } from 'rxjs';

import { Erc20Balance } from './Erc20Balance';
import { SubstrateBalance } from './SubstrateBalance';

import { Erc20 } from '../../contracts';
import { EvmClient } from '../../evm';
import { SubstrateService } from '../../substrate';

export type BalanceOptions = {
  evmClient?: EvmClient;
  substrate: SubstrateService;
};

export class BalanceAdapter {
  protected evmClient!: EvmClient;
  protected substrate: SubstrateService;

  private erc20Balance!: Erc20Balance;
  private substrateBalance: SubstrateBalance;

  constructor({ evmClient, substrate }: BalanceOptions) {
    this.substrate = substrate;
    this.substrateBalance = new SubstrateBalance(substrate);

    if (evmClient) {
      this.evmClient = evmClient;
      this.erc20Balance = new Erc20Balance(evmClient);
    }
  }

  async read(asset: Asset, config: BaseConfig): Promise<AssetAmount> {
    if (config.type === CallType.Evm) {
      const erc20 = new Erc20(this.evmClient, config as ContractConfig);
      return this.erc20Balance.read(asset, erc20);
    }

    return this.substrateBalance.read(asset, config as SubstrateQueryConfig);
  }

  subscribe(asset: Asset, config: BaseConfig): Observable<AssetAmount> {
    if (config.type === CallType.Evm) {
      const erc20 = new Erc20(this.evmClient, config as ContractConfig);
      return this.erc20Balance.subscribe(asset, erc20);
    }

    return this.substrateBalance.subscribe(
      asset,
      config as SubstrateQueryConfig
    );
  }
}
