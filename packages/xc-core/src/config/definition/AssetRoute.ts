import { Asset } from '../../asset';
import { AnyChain } from '../../chain';

import { ContractConfigBuilder } from './contract';
import { ExtrinsicConfigBuilder } from './extrinsic';
import { FeeConfig, DestinationFeeConfig } from './fee';
import { FunctionCallConfigBuilder } from './functionCall';
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

export interface AssetRouteParams {
  source: SourceConfig;
  destination: DestinationConfig;
  contract?: ContractConfigBuilder;
  extrinsic?: ExtrinsicConfigBuilder;
  functionCall?: FunctionCallConfigBuilder;
  move?: MoveConfigBuilder;
  program?: ProgramConfigBuilder;
  tags?: string[];
}

export class AssetRoute {
  readonly source: SourceConfig;

  readonly destination: DestinationConfig;

  readonly contract?: ContractConfigBuilder;

  readonly extrinsic?: ExtrinsicConfigBuilder;

  readonly functionCall?: FunctionCallConfigBuilder;

  readonly move?: MoveConfigBuilder;

  readonly program?: ProgramConfigBuilder;

  readonly tags?: string[];

  constructor({
    source,
    destination,
    contract,
    extrinsic,
    functionCall,
    move,
    program,
    tags,
  }: AssetRouteParams) {
    this.source = source;
    this.destination = destination;
    this.contract = contract;
    this.extrinsic = extrinsic;
    this.functionCall = functionCall;
    this.move = move;
    this.program = program;
    this.tags = tags;
  }
}
