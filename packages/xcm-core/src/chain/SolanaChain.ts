import { Connection } from '@solana/web3.js';

import { Chain, ChainAssetData, ChainParams, ChainType } from './Chain';
import { Wormhole, WormholeDef } from '../bridge';

export interface SolanaChainParams extends ChainParams<ChainAssetData> {
  id: number;
  rpcs: string[];
  wormhole?: WormholeDef;
}

export class SolanaChain extends Chain<ChainAssetData> {
  readonly id: number;
  readonly rpcs: string[];
  readonly wormhole?: Wormhole;

  constructor({ id, rpcs, wormhole, ...others }: SolanaChainParams) {
    super({ ...others });
    this.id = id;
    this.rpcs = rpcs;
    this.wormhole = wormhole && new Wormhole(wormhole);
  }

  get connection(): Connection {
    return new Connection(this.rpcs[0], 'confirmed');
  }

  getType(): ChainType {
    return ChainType.SolanaChain;
  }
}
