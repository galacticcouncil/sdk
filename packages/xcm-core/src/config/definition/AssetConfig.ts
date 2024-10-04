import { Asset } from '../../asset';
import { AnyChain, EvmParachain } from '../../chain';

import { BalanceConfigBuilder } from './balance';
import { ContractConfigBuilder } from './contract';
import { ExtrinsicConfigBuilder } from './extrinsic';
import { FeeConfig, DestinationFeeConfig, RouteFeeConfig } from './fee';
import { MinConfigBuilder } from './min';

export interface RoutedViaConfig {
  chain: EvmParachain;
  fee?: RouteFeeConfig;
  transact?: ExtrinsicConfigBuilder;
}

export interface AssetConfigParams {
  asset: Asset;
  balance: BalanceConfigBuilder;
  contract?: ContractConfigBuilder;
  destination: AnyChain;
  destinationFee: DestinationFeeConfig;
  extrinsic?: ExtrinsicConfigBuilder;
  fee?: FeeConfig;
  min?: MinConfigBuilder;
  via?: RoutedViaConfig;
}

export class AssetConfig {
  readonly asset: Asset;

  readonly balance: BalanceConfigBuilder;

  readonly contract?: ContractConfigBuilder;

  readonly destination: AnyChain;

  readonly destinationFee: DestinationFeeConfig;

  readonly extrinsic?: ExtrinsicConfigBuilder;

  readonly fee?: FeeConfig;

  readonly min?: MinConfigBuilder;

  readonly via?: RoutedViaConfig;

  constructor({
    asset,
    balance,
    contract,
    destination,
    destinationFee,
    extrinsic,
    fee,
    min,
    via,
  }: AssetConfigParams) {
    this.asset = asset;
    this.balance = balance;
    this.contract = contract;
    this.destination = destination;
    this.destinationFee = destinationFee;
    this.extrinsic = extrinsic;
    this.fee = fee;
    this.min = min;
    this.via = via;
  }
}
