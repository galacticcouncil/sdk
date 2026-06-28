import { Chain as EvmChainDef } from 'viem';

import { from, switchMap, Observable } from 'rxjs';

import { Asset, AssetAmount } from '../asset';
import { EvmBalanceClient, isEvmBalanceType } from './balance';
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
  private readonly evmBalanceClient = new EvmBalanceClient(this);

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

  get evmClient(): EvmClient {
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
      return this.evmResolver.toH160(address, this.client);
    }
    throw new Error(`No EVM resolver found for ` + this.name);
  }

  override async getBalance(
    asset: Asset,
    address: string
  ): Promise<AssetAmount> {
    const type = this.getBalanceType(asset);
    const account = await this.resolveAccount(asset, address);
    return isEvmBalanceType(type)
      ? this.evmBalanceClient.getBalance(asset, account, type)
      : this.balanceClient.getBalance(asset, account, type);
  }

  override subscribeBalance(
    asset: Asset,
    address: string
  ): Observable<AssetAmount> {
    const type = this.getBalanceType(asset);
    return from(this.resolveAccount(asset, address)).pipe(
      switchMap((account) =>
        isEvmBalanceType(type)
          ? this.evmBalanceClient.subscribe(asset, account, type)
          : this.balanceClient.subscribe(asset, account, type)
      )
    );
  }

  /**
   * EVM parachains key balances by the derived h160 account when the asset's
   * balance id is an evm address.
   */
  private async resolveAccount(asset: Asset, address: string): Promise<string> {
    const assetId = this.getBalanceAssetId(asset);
    return EvmAddr.isValid(assetId.toString())
      ? this.getDerivatedAddress(address)
      : address;
  }
}
