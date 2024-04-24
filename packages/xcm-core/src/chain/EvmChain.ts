import { Chain as EvmDef } from 'viem';
import { Chain, ChainAssetData, ChainParams, ChainType } from './Chain';
import { EvmClient, WormholeDef } from '../evm';

export interface EvmChainParams extends ChainParams<ChainAssetData> {
  defEvm: EvmDef;
  defWormhole?: WormholeDef;
}

export class EvmChain extends Chain<ChainAssetData> {
  readonly defEvm: EvmDef;
  readonly defWormhole?: WormholeDef;

  constructor({ defEvm, defWormhole, ...others }: EvmChainParams) {
    super({ ...others });
    this.defEvm = defEvm;
    this.defWormhole = defWormhole;
  }

  get client(): EvmClient {
    return new EvmClient(this.defEvm);
  }

  getType(): ChainType {
    return ChainType.EvmChain;
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
}
