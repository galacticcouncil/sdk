import { ConfigBuilder, ConfigService } from '@moonbeam-network/xcm-config';
import { Asset, AnyChain, AssetAmount } from '@moonbeam-network/xcm-types';
import { toBigInt } from '@moonbeam-network/xcm-utils';

import { combineLatest, debounceTime, Subscription } from 'rxjs';
import { Chain } from 'viem';

import { BalanceAdapter } from './adapters';
import {
  EvmClient,
  EvmReconciler,
  EvmResolver,
  evmChains as defaultEvmChains,
  evmResolvers as defaultEvmResolvers,
} from './evm';
import { SubstrateService } from './substrate';

import {
  TransferService,
  calculateMax,
  calculateMin,
  buildTransfer,
} from './transfer';
import { XCall, XData } from './types';
import { isH160Address } from './utils';

export interface EvmChains {
  [key: string]: Chain;
}

export interface EvmResolvers {
  [key: string]: EvmResolver;
}

export interface WalletOptions {
  configService: ConfigService;
  evmChains?: EvmChains;
  evmResolvers?: EvmResolvers;
}

export class Wallet {
  private readonly configService: ConfigService;
  private readonly evmClients: Record<string, EvmClient> = {};
  private readonly evmResolvers: Record<string, EvmResolver> = {};

  constructor({ configService, evmChains, evmResolvers }: WalletOptions) {
    this.configService = configService;
    this.evmResolvers = evmResolvers ?? defaultEvmResolvers;
    const chains = evmChains ?? defaultEvmChains;
    Object.entries(chains).forEach(([name, chain]) => {
      this.evmClients[name] = new EvmClient(chain);
    });
  }

  public getEvmClient(chain: string | AnyChain): EvmClient {
    const aChain = this.configService.getChain(chain);
    return this.evmClients[aChain.key];
  }

  public getEvmReconciler(chain: string | AnyChain): EvmReconciler {
    const aChain = this.configService.getChain(chain);
    const evmProvider = this.evmResolvers[aChain.key];
    return new EvmReconciler(aChain, evmProvider);
  }

  private async getSubstrateService(
    chain: string | AnyChain
  ): Promise<SubstrateService> {
    const aChain = this.configService.getChain(chain);
    return await SubstrateService.create(aChain, this.configService);
  }

  public async transfer(
    asset: string | Asset,
    srcAddr: string,
    srcChain: string | AnyChain,
    destAddr: string,
    destChain: string | AnyChain
  ): Promise<XData> {
    const { source, destination } = ConfigBuilder(this.configService)
      .assets()
      .asset(asset)
      .source(srcChain)
      .destination(destChain)
      .build();

    const srcEvm = this.getEvmClient(srcChain);
    const srcEvmReconciler = this.getEvmReconciler(srcChain);
    const srcSubstrate = await this.getSubstrateService(srcChain);
    const srcEd = srcSubstrate.existentialDeposit;
    const srcData = new TransferService(srcEvm, srcEvmReconciler, srcSubstrate);

    const destEvm = this.getEvmClient(destChain);
    const destEvmReconciler = this.getEvmReconciler(destChain);
    const destSubstrate = await this.getSubstrateService(destChain);
    const destEd = destSubstrate.existentialDeposit;
    const destData = new TransferService(
      destEvm,
      destEvmReconciler,
      destSubstrate
    );

    const [srcBalance, srcFeeBalance, srcMin, destBalance, destFee, destMin] =
      await Promise.all([
        srcData.getBalance(srcAddr, source),
        srcData.getFeeBalance(srcAddr, source),
        srcData.getMin(source),
        destData.getBalance(destAddr, destination),
        destData.getDestinationFee(source),
        destData.getMin(destination),
      ]);

    const transactInfo = srcData.isMrl(source)
      ? await destData.getTransactInfo(
          srcAddr,
          srcBalance.amount, // should be transfer amount
          destAddr,
          destination.chain,
          destFee,
          source
        )
      : undefined;

    const srcFee = await srcData.getFee(
      srcAddr,
      srcBalance.amount,
      srcFeeBalance,
      destAddr,
      destination.chain,
      destFee,
      source,
      transactInfo
    );

    const min = calculateMin(destBalance, destEd, destFee, destMin);
    const max = calculateMax(srcBalance, srcEd, srcFee, srcMin);

    return {
      balance: srcBalance,
      destFee,
      max,
      min,
      srcFee,
      srcFeeBalance,
      async buildCall(amount): Promise<XCall> {
        const transactInfo = srcData.isMrl(source)
          ? await destData.getTransactInfo(
              srcAddr,
              toBigInt(amount, srcBalance.decimals),
              destAddr,
              destination.chain,
              destFee,
              source
            )
          : undefined;
        const config = buildTransfer(
          toBigInt(amount, srcBalance.decimals),
          destAddr,
          destination.chain,
          destFee,
          source,
          transactInfo
        );
        return srcData.transfer.calldata(config);
      },
    } as XData;
  }

  public async subscribeBalance(
    address: string,
    chain: string | AnyChain,
    observer: (balances: AssetAmount[]) => void
  ): Promise<Subscription> {
    const chainConfig = this.configService.getChainConfig(chain);
    const evmClient = this.getEvmClient(chain);
    const evmReconciler = this.getEvmReconciler(chain);
    const substrate = await this.getSubstrateService(chain);

    const balanceAdapter = new BalanceAdapter({
      evmClient,
      substrate,
    });

    const configs = chainConfig.getAssetsConfigs();
    const uniqueConfigs = [
      ...new Map(configs.map((cfg) => [cfg.asset, cfg])).values(),
    ];

    const observables = uniqueConfigs.map(async (assetConfig) => {
      const { asset, balance } = assetConfig;
      const { chain } = chainConfig;
      const assetId = chain.getBalanceAssetId(asset);
      const isErc20 = isH160Address(assetId.toString());
      const evmAddr = isErc20
        ? await evmReconciler.toEvmAddress(address, substrate.api)
        : address;
      const balanceConfig = balance.build({
        address: evmAddr,
        asset: assetId,
      });
      return balanceAdapter.subscribe(asset, balanceConfig);
    });
    const ob = await Promise.all(observables);
    const observable = combineLatest(ob);
    return observable.pipe(debounceTime(500)).subscribe(observer);
  }
}
