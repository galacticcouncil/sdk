import { h160 } from '@galacticcouncil/common';

import { Chain as EvmChainDef } from 'viem';

import { from, switchMap, Observable } from 'rxjs';

import { Asset, AssetAmount } from '../asset';
import {
  EvmBalanceClient,
  EvmBalanceType,
  isEvmBalanceType,
  SubstrateBalanceType,
} from './balance';
import { ChainType } from './Chain';
import { Parachain, ParachainParams } from './Parachain';

import { Wormhole, WormholeDef } from '../bridge';
import { EvmClient, EvmResolver } from '../evm';
import { addr } from '../utils';

const { EvmAddr, Ss58Addr } = addr;
const { H160 } = h160;

type EvmParachainBalanceType = SubstrateBalanceType | EvmBalanceType;

export interface EvmParachainParams extends ParachainParams<EvmParachainBalanceType> {
  evmChain: EvmChainDef;
  evmResolver?: EvmResolver;
  rpcs?: string[];
  wormhole?: WormholeDef;
}

export class EvmParachain extends Parachain<EvmParachainBalanceType> {
  private readonly evmBalanceClient = new EvmBalanceClient(this);

  private clientCache?: EvmClient;

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

  /**
   * Memoized. Viem keys block-watch dedupe and multicall batching on client
   * identity, so a fresh client per read defeats both.
   */
  get evmClient(): EvmClient {
    if (!this.clientCache) {
      this.clientCache = new EvmClient(this.evmChain, this.rpcs);
    }
    return this.clientCache;
  }

  getType(): ChainType {
    return ChainType.EvmParachain;
  }

  /**
   * Both ss58 and h160 resolve to the same account here, so either is valid.
   * H160 native chains take h160 only.
   */
  override isValidAddress(address: string): boolean {
    return this.usesH160Acc
      ? EvmAddr.isValid(address)
      : Ss58Addr.isValid(address) || EvmAddr.isValid(address);
  }

  /**
   * H160 addresses map to their derived ss58 account. H160 native chains keep
   * the address as is.
   */
  override getNormalizedAddress(address: string): string {
    return !this.usesH160Acc && EvmAddr.isValid(address)
      ? H160.toAccount(address)
      : address;
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
