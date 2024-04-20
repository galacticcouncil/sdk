import {
  AssetMinConfigBuilder,
  BalanceConfigBuilder,
  ContractConfigBuilder,
  ExtrinsicConfigBuilder,
  FeeConfigBuilder,
} from '@moonbeam-network/xcm-builder';
import { AnyChain, Asset } from '@moonbeam-network/xcm-types';

import {
  ExtrinsicConfigBuilderV2,
  ContractConfigBuilderV2,
} from '../overrides';

export interface AssetConfigParams {
  asset: Asset;
  balance: BalanceConfigBuilder;
  contract?: ContractConfigBuilder;
  destination: AnyChain;
  destinationFee: DestinationFeeConfig;
  extrinsic?: ExtrinsicConfigBuilder;
  fee?: FeeAssetConfig;
  min?: AssetMinConfigBuilder;
  transact?: ExtrinsicConfigBuilder;
}

export class AssetConfig {
  readonly asset: Asset;

  readonly balance: BalanceConfigBuilder;

  readonly contract?: ContractConfigBuilderV2;

  readonly destination: AnyChain;

  readonly destinationFee: DestinationFeeConfig;

  readonly extrinsic?: ExtrinsicConfigBuilderV2;

  readonly fee?: FeeAssetConfig;

  readonly min?: AssetMinConfigBuilder;

  readonly transact?: ExtrinsicConfigBuilderV2;

  constructor({
    asset,
    balance,
    contract,
    destination,
    destinationFee,
    extrinsic,
    fee,
    min,
    transact,
  }: AssetConfigParams) {
    this.asset = asset;
    this.balance = balance;
    this.contract = contract;
    this.destination = destination;
    this.destinationFee = destinationFee;
    this.extrinsic = extrinsic;
    this.fee = fee;
    this.min = min;
    this.transact = transact;
  }
}

export interface DestinationFeeConfig extends FeeAssetConfig {
  amount: number | FeeConfigBuilder;
}

export interface FeeAssetConfig {
  asset: Asset;
  balance: BalanceConfigBuilder;
  xcmDeliveryFeeAmount?: number;
}
