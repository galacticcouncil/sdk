import { Asset } from '../../asset';
import { AnyChain, Parachain } from '../../chain';

import { ContractConfigBuilder } from './contract';
import { ExtrinsicConfigBuilder } from './extrinsic';
import { FeeConfig, DestinationFeeConfig, TransactFeeConfig } from './fee';
import { ProgramConfigBuilder } from './program';
import { MoveConfigBuilder } from './move';

export interface SourceConfig {
  asset: Asset;
  // Optional fee-asset override. When unset, the destination fee is paid in
  // `destination.fee.asset`. Balance/min are read from the chain registry.
  destinationFee?: Asset;
  fee?: FeeConfig;
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

export interface AssetRouteParams {
  source: SourceConfig;
  destination: DestinationConfig;
  contract?: ContractConfigBuilder;
  extrinsic?: ExtrinsicConfigBuilder;
  move?: MoveConfigBuilder;
  program?: ProgramConfigBuilder;
  transact?: TransactConfig;
  tags?: string[];
}

export class AssetRoute {
  readonly source: SourceConfig;

  readonly destination: DestinationConfig;

  readonly contract?: ContractConfigBuilder;

  readonly extrinsic?: ExtrinsicConfigBuilder;

  readonly move?: MoveConfigBuilder;

  readonly program?: ProgramConfigBuilder;

  readonly transact?: TransactConfig;

  readonly tags?: string[];

  constructor({
    source,
    destination,
    contract,
    extrinsic,
    move,
    program,
    transact,
    tags,
  }: AssetRouteParams) {
    this.source = source;
    this.destination = destination;
    this.contract = contract;
    this.extrinsic = extrinsic;
    this.move = move;
    this.program = program;
    this.transact = transact;
    this.tags = tags;
  }
}
