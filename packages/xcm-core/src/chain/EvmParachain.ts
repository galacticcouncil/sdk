import { ChainType } from './Chain';
import { Parachain, ParachainParams } from './Parachain';

export interface EvmParachainParams extends ParachainParams {
  id: number;
  rpc: string;
}

export class EvmParachain extends Parachain {
  readonly id: number;

  readonly rpc: string;

  constructor({ id, rpc, ...others }: EvmParachainParams) {
    super({ ...others });
    this.id = id;
    this.rpc = rpc;
  }

  getType(): ChainType {
    return ChainType.EvmParachain;
  }
}
