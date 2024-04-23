import {
  Asset,
  AnyChain,
  AssetAmount,
  ConfigBuilder,
  ConfigService,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { toBigInt } from '@moonbeam-network/xcm-utils';

import { combineLatest, debounceTime, Subscription } from 'rxjs';

import { BalanceAdapter } from './adapters';
import {
  EvmClient,
  EvmReconciler,
  EvmChains,
  EvmResolvers,
  evmChains as defaultEvmChains,
  evmResolvers as defaultEvmResolvers,
} from './evm';
import { SubstrateService } from './substrate';

import { TransferService, calculateMax, calculateMin } from './transfer';
import { XCall, XData } from './types';
import { isH160Address } from './utils';

export interface WalletOptions {
  config: ConfigService;
  evmChains?: EvmChains;
  evmResolvers?: EvmResolvers;
}

export class Wallet {
  private readonly config: ConfigService;
  private readonly evmClients: Record<string, EvmClient> = {};
  private readonly evmReconcilers: Record<string, EvmReconciler> = {};

  constructor({ config, evmChains, evmResolvers }: WalletOptions) {
    this.config = config;
    this.setupEvmClients(evmChains);
    this.setupEvmReconcilers(evmResolvers);
  }

  private setupEvmClients(evmChains?: EvmChains) {
    const chains = evmChains ?? defaultEvmChains;
    Object.entries(chains).forEach(([name, chain]) => {
      this.evmClients[name] = new EvmClient(chain);
    });
  }

  private setupEvmReconcilers(evmResolvers?: EvmResolvers) {
    const resolvers = evmResolvers ?? defaultEvmResolvers;
    this.config.chains.forEach((chain) => {
      const resolver = resolvers[chain.key];
      this.evmReconcilers[chain.key] = new EvmReconciler(chain, resolver);
    });
  }

  private evmClient(chain: string | AnyChain): EvmClient {
    const ch = this.config.getChain(chain);
    return this.evmClients[ch.key];
  }

  private evmReconciler(chain: string | AnyChain): EvmReconciler {
    const ch = this.config.getChain(chain);
    return this.evmReconcilers[ch.key];
  }

  private async substrateService(
    chain: string | AnyChain
  ): Promise<SubstrateService> {
    const aChain = this.config.getChain(chain); // TODO - fix
    return await SubstrateService.create(aChain as Parachain, this.config);
  }

  private async transferService(
    chain: string | AnyChain
  ): Promise<TransferService> {
    const evmClient = this.evmClient(chain);
    const evmReconciler = this.evmReconciler(chain);
    const substrate = await this.substrateService(chain);
    return new TransferService(evmClient, evmReconciler, substrate);
  }

  public async transfer(
    asset: string | Asset,
    srcAddr: string,
    srcChain: string | AnyChain,
    dstAddr: string,
    dstChain: string | AnyChain
  ): Promise<XData> {
    const transfer = ConfigBuilder(this.config)
      .assets()
      .asset(asset)
      .source(srcChain)
      .destination(dstChain)
      .build();

    const srcConf = transfer.source;
    const dstConf = transfer.destination;

    const src = await this.transferService(srcChain);
    const dst = await this.transferService(dstChain);

    const [srcBalance, srcFeeBalance, srcMin, dstBalance, dstFee, dstMin] =
      await Promise.all([
        src.getBalance(srcAddr, srcConf),
        src.getFeeBalance(srcAddr, srcConf),
        src.getMin(srcConf),
        dst.getBalance(dstAddr, dstConf),
        dst.getDestinationFee(srcConf),
        dst.getMin(dstConf),
      ]);

    const srcFee = await src.getFee(
      srcAddr,
      srcBalance.amount,
      srcFeeBalance,
      dstAddr,
      dstConf.chain,
      dstFee,
      srcConf
    );

    const dstEd = dst.substrate.existentialDeposit;
    const min = calculateMin(dstBalance, dstEd, dstFee, dstMin);

    const srcEd = dst.substrate.existentialDeposit;
    const max = calculateMax(srcBalance, srcEd, srcFee, srcMin);

    return {
      balance: srcBalance,
      dstFee,
      max,
      min,
      srcFee,
      srcFeeBalance,
      async buildCall(amount): Promise<XCall> {
        return src.getCall(
          srcAddr,
          toBigInt(amount, srcBalance.decimals),
          dstAddr,
          dstConf.chain,
          dstFee,
          srcConf
        );
      },
    } as XData;
  }

  public signAndSend() {}

  public async subscribeBalance(
    address: string,
    chain: string | AnyChain,
    observer: (balances: AssetAmount[]) => void
  ): Promise<Subscription> {
    const chainConfig = this.config.getChainConfig(chain);
    const evmClient = this.evmClient(chain);
    const evmReconciler = this.evmReconciler(chain);
    const substrate = await this.substrateService(chain);

    const balanceAdapter = new BalanceAdapter({
      substrate,
      evmClient,
    });

    const observables = chainConfig
      .getUniqueAssetsConfigs()
      .map(async ({ asset, balance }) => {
        const { chain } = chainConfig;
        const assetId = chain.getBalanceAssetId(asset);
        const account = isH160Address(assetId.toString())
          ? await evmReconciler.toEvmAddress(address, substrate.api)
          : address;
        const balanceConfig = balance.build({
          address: account,
          asset: assetId,
        });
        return balanceAdapter.subscribe(asset, balanceConfig);
      });

    const ob = await Promise.all(observables);
    const observable = combineLatest(ob);
    return observable.pipe(debounceTime(500)).subscribe(observer);
  }
}
