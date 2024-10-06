import { Asset } from '../../asset';
import { AnyChain, EvmParachain } from '../../chain';

import { BalanceConfigBuilder } from './balance';
import { ContractConfigBuilder } from './contract';
import { ExtrinsicConfigBuilder } from './extrinsic';
import { FeeConfig, DestinationFeeConfig, RouteFeeConfig } from './fee';
import { MinConfigBuilder } from './min';

export interface SourceConfig {
  asset: Asset;
  balance: BalanceConfigBuilder;
  destinationFee: {
    balance: BalanceConfigBuilder;
  };
  fee?: FeeConfig;
  min?: MinConfigBuilder;
}

export interface DestinationConfig {
  asset: Asset;
  balance: BalanceConfigBuilder;
  chain: AnyChain;
  fee: DestinationFeeConfig;
}

export interface RoutedViaConfig {
  chain: EvmParachain;
  fee?: RouteFeeConfig;
  transact?: ExtrinsicConfigBuilder;
}

export interface AssetRouteParams {
  source: SourceConfig;
  destination: DestinationConfig;
  contract?: ContractConfigBuilder;
  extrinsic?: ExtrinsicConfigBuilder;
  via?: RoutedViaConfig;
}

export class AssetRoute {
  readonly source: SourceConfig;

  readonly destination: DestinationConfig;

  readonly contract?: ContractConfigBuilder;

  readonly extrinsic?: ExtrinsicConfigBuilder;

  readonly via?: RoutedViaConfig;

  constructor({
    source,
    destination,
    contract,
    extrinsic,
    via,
  }: AssetRouteParams) {
    this.source = source;
    this.destination = destination;
    this.contract = contract;
    this.extrinsic = extrinsic;
    this.via = via;
  }
}
