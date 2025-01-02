import { Connection } from '@solana/web3.js';

import {
  Chain,
  ChainAssetData,
  ChainCurrency,
  ChainParams,
  ChainType,
} from './Chain';
import { RpcUrls } from './types';

import { Wormhole, WormholeDef } from '../bridge';

export interface SolanaChainParams extends ChainParams<ChainAssetData> {
  id: number;
  rpcUrls: RpcUrls;
  wormhole?: WormholeDef;
}

export class SolanaChain extends Chain<ChainAssetData> {
  readonly id: number;
  readonly rpcUrls: RpcUrls;
  readonly wormhole?: Wormhole;

  constructor({ id, rpcUrls, wormhole, ...others }: SolanaChainParams) {
    super({ ...others });
    this.id = id;
    this.rpcUrls = rpcUrls;
    this.wormhole = wormhole && new Wormhole(wormhole);
  }

  get connection(): Connection {
    const { http, webSocket } = this.rpcUrls;

    let endpoint = http[0];
    let wsEndpoint = webSocket[0];
    try {
      endpoint = import.meta.env.GC_XCM_SOLANA_HTTP;
      wsEndpoint = import.meta.env.GC_XCM_SOLANA_WSS;
    } catch {}

    return new Connection(endpoint, {
      wsEndpoint: wsEndpoint,
      commitment: 'confirmed',
    });
  }

  getType(): ChainType {
    return ChainType.SolanaChain;
  }

  async getCurrency(): Promise<ChainCurrency> {
    return { symbol: 'SOL', decimals: 9 } as ChainCurrency;
  }
}
