import { Asset } from '../../asset';
import { AnyChain, Parachain } from '../../chain';

import { BalanceConfigBuilder } from './balance';
import { ContractConfigBuilder } from './contract';
import { ExtrinsicConfigBuilder } from './extrinsic';
import { FeeConfig, DestinationFeeConfig, TransactFeeConfig } from './fee';
import { MinConfigBuilder } from './min';

export interface SourceConfig {
  asset: Asset;
  balance: BalanceConfigBuilder;
  destinationFee: {
    asset?: Asset;
    balance: BalanceConfigBuilder;
  };
  fee?: FeeConfig;
  min?: MinConfigBuilder;
}

export interface DestinationConfig {
  chain: AnyChain;
  asset: Asset;
  fee: DestinationFeeConfig;
}

export interface TransactConfig {
  chain: Parachain;
  fee: TransactFeeConfig;
  extrinsic: ExtrinsicConfigBuilder;
}

export enum Bridge {
  Snowbridge = 'Snowbridge',
  Wormhole = 'Wormhole',
}

export interface AssetRouteParams {
  source: SourceConfig;
  destination: DestinationConfig;
  contract?: ContractConfigBuilder;
  extrinsic?: ExtrinsicConfigBuilder;
  transact?: TransactConfig;
}

export class AssetRoute {
  readonly source: SourceConfig;

  readonly destination: DestinationConfig;

  readonly contract?: ContractConfigBuilder;

  readonly extrinsic?: ExtrinsicConfigBuilder;

  readonly transact?: TransactConfig;

  constructor({
    source,
    destination,
    contract,
    extrinsic,
    transact,
  }: AssetRouteParams) {
    this.source = source;
    this.destination = destination;
    this.contract = contract;
    this.extrinsic = extrinsic;
    this.transact = transact;
  }
}
