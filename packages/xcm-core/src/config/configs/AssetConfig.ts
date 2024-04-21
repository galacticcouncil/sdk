import {
  AssetMinConfigBuilder,
  BalanceConfigBuilder,
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
  contract?: ContractConfigBuilderV2;
  destination: AnyChain;
  destinationFee: DestinationFeeConfig;
  extrinsic?: ExtrinsicConfigBuilderV2;
  fee?: FeeAssetConfig;
  min?: AssetMinConfigBuilder;
  transact?: ExtrinsicConfigBuilderV2;
  transactVia?: AnyChain;
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

  readonly transactVia?: AnyChain;

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
    transactVia,
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
    this.transactVia = transactVia;
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
