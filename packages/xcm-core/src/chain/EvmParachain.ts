import { Chain as EvmChainDef } from 'viem';
import { ChainType } from './Chain';
import { Parachain, ParachainParams } from './Parachain';
import { Wormhole, WormholeDef } from './types';
import { EvmClient, EvmResolver } from '../evm';
import { addr } from '../utils';

export interface EvmParachainParams extends ParachainParams {
  evmChain: EvmChainDef;
  evmResolver?: EvmResolver;
  wormhole?: WormholeDef;
}

export class EvmParachain extends Parachain implements Wormhole {
  readonly evmChain: EvmChainDef;
  readonly evmResolver?: EvmResolver;
  readonly wormhole?: WormholeDef;

  constructor({
    evmChain,
    evmResolver,
    wormhole,
    ...others
  }: EvmParachainParams) {
    super({ ...others });
    this.evmChain = evmChain;
    this.evmResolver = evmResolver;
    this.wormhole = wormhole;
  }

  get client(): EvmClient {
    return new EvmClient(this.evmChain);
  }

  getType(): ChainType {
    return ChainType.EvmParachain;
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

  async getDerivatedAddress(address: string): Promise<string> {
    if (addr.isH160(address)) {
      return address;
    }

    if (this.evmResolver) {
      const api = await this.api;
      return this.evmResolver.toH160(address, api);
    }
    throw new Error(`No EVM resolver found for ` + this.name);
  }
}
