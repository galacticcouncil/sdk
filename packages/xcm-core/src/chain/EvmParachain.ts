import { Chain as EvmChainDef } from 'viem';

import { ChainType } from './Chain';
import { Parachain, ParachainParams } from './Parachain';

import { Wormhole, WormholeDef } from '../bridge';
import { EvmClient, EvmResolver } from '../evm';
import { addr } from '../utils';

const { EvmAddr } = addr;

export interface EvmParachainParams extends ParachainParams {
  evmChain: EvmChainDef;
  evmResolver?: EvmResolver;
  rpcs?: string[];
  wormhole?: WormholeDef;
}

export class EvmParachain extends Parachain {
  readonly evmChain: EvmChainDef;
  readonly evmResolver?: EvmResolver;
  readonly rpcs?: string[];
  readonly wormhole?: Wormhole;

  constructor({
    evmChain,
    evmResolver,
    rpcs,
    wormhole,
    ...others
  }: EvmParachainParams) {
    super({ ...others });
    this.evmChain = evmChain;
    this.evmResolver = evmResolver;
    this.rpcs = rpcs;
    this.wormhole = wormhole && new Wormhole(wormhole);
  }

  get client(): EvmClient {
    return new EvmClient(this.evmChain, this.rpcs);
  }

  getType(): ChainType {
    return ChainType.EvmParachain;
  }

  async getDerivatedAddress(address: string): Promise<string> {
    if (EvmAddr.isValid(address)) {
      return address;
    }

    if (this.evmResolver) {
      const api = await this.api;
      return this.evmResolver.toH160(address, api);
    }
    throw new Error(`No EVM resolver found for ` + this.name);
  }
}
