import { Asset } from '../../asset';
import { AnyChain, Parachain } from '../../chain';

import { BalanceConfigBuilder } from './balance';
import { ContractConfigBuilder } from './contract';
import { ExtrinsicConfigBuilder } from './extrinsic';
import { FeeAssetConfig, DestinationFeeConfig } from './fee';
import { MinConfigBuilder } from './min';

export interface AssetConfigParams {
  asset: Asset;
  balance: BalanceConfigBuilder;
  contract?: ContractConfigBuilder;
  destination: AnyChain;
  destinationFee: DestinationFeeConfig;
  extrinsic?: ExtrinsicConfigBuilder;
  fee?: FeeAssetConfig;
  min?: MinConfigBuilder;
  transact?: ExtrinsicConfigBuilder;
  transactVia?: Parachain;
}

export class AssetConfig {
  readonly asset: Asset;

  readonly balance: BalanceConfigBuilder;

  readonly contract?: ContractConfigBuilder;

  readonly destination: AnyChain;

  readonly destinationFee: DestinationFeeConfig;

  readonly extrinsic?: ExtrinsicConfigBuilder;

  readonly fee?: FeeAssetConfig;

  readonly min?: MinConfigBuilder;

  readonly transact?: ExtrinsicConfigBuilder;

  readonly transactVia?: Parachain;

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
