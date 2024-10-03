import { Chain as EvmChainDef } from 'viem';
import { Chain, ChainAssetData, ChainParams, ChainType } from './Chain';
import { Wormhole, WormholeDef } from './types';
import { EvmClient } from '../evm';

export interface EvmChainParams extends ChainParams<ChainAssetData> {
  evmChain: EvmChainDef;
  id: number;
  wormhole?: WormholeDef;
}

export class EvmChain extends Chain<ChainAssetData> implements Wormhole {
  readonly evmChain: EvmChainDef;
  readonly id: number;
  readonly wormhole?: WormholeDef;

  constructor({ evmChain, id, wormhole, ...others }: EvmChainParams) {
    super({ ...others });
    this.evmChain = evmChain;
    this.id = id;
    this.wormhole = wormhole;
  }

  get client(): EvmClient {
    return new EvmClient(this.evmChain);
  }

  getType(): ChainType {
    return ChainType.EvmChain;
  }

  getWormholeId(): number {
    if (this.wormhole) {
      return this.wormhole.id;
    }
    throw new Error('Wormhole configuration missing');
  }

  getTokenBridge(): string {
    if (this.wormhole) {
      return this.wormhole.tokenBridge;
    }
    throw new Error('Wormhole configuration missing');
  }

  getTokenRelayer(): string | undefined {
    if (this.wormhole) {
      return this.wormhole.tokenRelayer;
    }
    throw new Error('Wormhole configuration missing');
  }
}
