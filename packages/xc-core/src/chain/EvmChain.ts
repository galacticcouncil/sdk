import { Chain as EvmChainDef } from 'viem';

import { Observable } from 'rxjs';

import { Asset, AssetAmount } from '../asset';
import { EvmBalanceClient } from './balance';
import {
  Chain,
  ChainAssetData,
  ChainCurrency,
  ChainParams,
  ChainType,
} from './Chain';

import {
  Basejump,
  BasejumpDef,
  Snowbridge,
  SnowbridgeDef,
  Wormhole,
  WormholeDef,
} from '../bridge';
import { EvmClient } from '../evm';

export interface EvmChainParams extends ChainParams<ChainAssetData> {
  evmChain: EvmChainDef;
  id: number;
  rpcs?: string[];
  basejump?: BasejumpDef;
  snowbridge?: SnowbridgeDef;
  wormhole?: WormholeDef;
}

export class EvmChain extends Chain<ChainAssetData> {
  private readonly balanceClient = new EvmBalanceClient(this);

  readonly evmChain: EvmChainDef;
  readonly id: number;
  readonly rpcs?: string[];
  readonly basejump?: Basejump;
  readonly snowbridge?: Snowbridge;
  readonly wormhole?: Wormhole;

  constructor({
    evmChain,
    id,
    rpcs,
    basejump,
    snowbridge,
    wormhole,
    ...others
  }: EvmChainParams) {
    super({ ...others });
    this.evmChain = evmChain;
    this.id = id;
    this.rpcs = rpcs;
    this.basejump = basejump && new Basejump(basejump);
    this.snowbridge = snowbridge && new Snowbridge(snowbridge);
    this.wormhole = wormhole && new Wormhole(wormhole);
  }

  get evmClient(): EvmClient {
    return new EvmClient(this.evmChain, this.rpcs);
  }

  getType(): ChainType {
    return ChainType.EvmChain;
  }

  async getCurrency(): Promise<ChainCurrency> {
    const { nativeCurrency } = this.evmClient.chain;
    const symbol = nativeCurrency.symbol;
    const decimals = nativeCurrency.decimals;
    const asset = this.getAsset(symbol.toLowerCase());
    if (asset) {
      return { asset, decimals } as ChainCurrency;
    }
    throw Error('Chain currency configuration not found');
  }

  async getBalance(asset: Asset, address: string): Promise<AssetAmount> {
    return this.balanceClient.getBalance(
      asset,
      address,
      this.getBalanceType(asset)
    );
  }

  subscribeBalance(asset: Asset, address: string): Observable<AssetAmount> {
    return this.balanceClient.subscribe(
      asset,
      address,
      this.getBalanceType(asset)
    );
  }
}
