import { Chain as EvmDef } from 'viem';
import { ChainType } from './Chain';
import { Parachain, ParachainParams } from './Parachain';
import { EvmClient, EvmResolver, WormholeDef } from '../evm';
import { isH160Address } from '../utils';

export interface EvmParachainParams extends ParachainParams {
  defEvm: EvmDef;
  defWormhole?: WormholeDef;
  evmResolver?: EvmResolver;
}

export class EvmParachain extends Parachain {
  readonly defEvm: EvmDef;
  readonly defWormhole?: WormholeDef;
  readonly evmResolver?: EvmResolver;

  constructor({
    defEvm,
    defWormhole,
    evmResolver,
    ...others
  }: EvmParachainParams) {
    super({ ...others });
    this.defEvm = defEvm;
    this.defWormhole = defWormhole;
    this.evmResolver = evmResolver;
  }

  get client(): EvmClient {
    return new EvmClient(this.defEvm);
  }

  getType(): ChainType {
    return ChainType.EvmParachain;
  }

  getWormholeId(): number {
    if (this.defWormhole) {
      return this.defWormhole.id;
    }
    throw new Error('Wormhole configuration missing');
  }

  getWormholeBridge(): string {
    if (this.defWormhole) {
      return this.defWormhole.tokenBridge;
    }
    throw new Error('Wormhole configuration missing');
  }

  async getDerivatedAddress(address: string): Promise<string> {
    if (isH160Address(address)) {
      return address;
    }

    if (this.evmResolver) {
      const api = await this.api;
      return this.evmResolver.toH160(address, api);
    }
    throw new Error(`No EVM resolver found for ` + this.name);
  }
}
