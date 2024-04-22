import { Chain, ChainAssetData, ChainParams, ChainType } from './Chain';

export interface EvmChainParams extends ChainParams<ChainAssetData> {
  id: number;
  rpc: string;
}

export class EvmChain extends Chain<ChainAssetData> {
  readonly id: number;

  readonly rpc: string;

  constructor({ id, rpc, ...others }: EvmChainParams) {
    super({ ...others });
    this.id = id;
    this.rpc = rpc;
  }

  getType(): ChainType {
    return ChainType.EvmChain;
  }
}
