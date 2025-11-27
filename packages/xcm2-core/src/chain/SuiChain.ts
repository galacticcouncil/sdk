import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

import {
  Chain,
  ChainAssetData,
  ChainCurrency,
  ChainParams,
  ChainType,
} from './Chain';

import { Wormhole, WormholeDef } from '../bridge';

const SUI_NATIVE = 'SUI';
const SUI_DECIMALS = 9;

export interface SuiChainParams extends ChainParams<ChainAssetData> {
  id: string;
  wormhole?: WormholeDef;
}

export class SuiChain extends Chain<ChainAssetData> {
  readonly id: string;
  readonly wormhole?: Wormhole;

  constructor({ id, wormhole, ...others }: SuiChainParams) {
    super({ ...others });
    this.id = id;
    this.wormhole = wormhole && new Wormhole(wormhole);
  }

  get client(): SuiClient {
    const rpcUrl = getFullnodeUrl('mainnet');
    return new SuiClient({ url: rpcUrl });
  }

  getType(): ChainType {
    return ChainType.SuiChain;
  }

  async getCurrency(): Promise<ChainCurrency> {
    const asset = this.getAsset(SUI_NATIVE.toLowerCase());
    if (asset) {
      return { asset, decimals: SUI_DECIMALS } as ChainCurrency;
    }
    throw Error('Chain currency configuration not found');
  }
}
