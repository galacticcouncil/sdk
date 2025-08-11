import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

import { encoding } from '@wormhole-foundation/sdk-base';

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
  id: number;
  wormhole?: WormholeDef;
}

export class SuiChain extends Chain<ChainAssetData> {
  readonly id: number;
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

  getPackageId(address: string): string {
    return this.zpadSuiAddress(encoding.hex.encode(address));
  }

  async getCurrency(): Promise<ChainCurrency> {
    const asset = this.getAsset(SUI_NATIVE.toLowerCase());
    if (asset) {
      return { asset, decimals: SUI_DECIMALS } as ChainCurrency;
    }
    throw Error('Chain currency configuration not found');
  }

  private zpadSuiAddress(address: string) {
    address = address.startsWith('0x') ? address.slice(2) : address;
    address = address.length % 2 === 0 ? address : '0' + address;

    const zpadded =
      address.length === 64
        ? address
        : encoding.hex.encode(
            encoding.bytes.zpad(encoding.hex.decode(address), 32)
          );

    return `0x${zpadded}`;
  }
}
