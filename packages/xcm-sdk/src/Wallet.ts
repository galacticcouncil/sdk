import { ConfigBuilder, ConfigService } from '@moonbeam-network/xcm-config';
import { Asset, AnyChain, AssetAmount } from '@moonbeam-network/xcm-types';
import { toBigInt } from '@moonbeam-network/xcm-utils';

import { combineLatest, debounceTime, Subscription } from 'rxjs';
import { Chain } from 'viem';

import { BalanceAdapter } from './adapters';
import { EvmClient, EvmResolver } from './evm';
import { SubstrateService } from './substrate';

import {
  TransferService,
  calculateMax,
  calculateMin,
  buildTransfer,
} from './transfer';
import { XCall, XData } from './types';

export interface EvmChains {
  [key: string]: Chain;
}

export interface EvmResolvers {
  [key: string]: EvmResolver;
}

export interface WalletOptions {
  configService: ConfigService;
  evmChains: EvmChains;
  evmResolvers?: EvmResolvers;
}

export class Wallet {
  private readonly configService: ConfigService;
  private readonly evmClients: Record<string, EvmClient> = {};
  private readonly evmResolvers: Record<string, EvmResolver> = {};

  constructor({ configService, evmChains, evmResolvers }: WalletOptions) {
    this.configService = configService;
    this.evmResolvers = evmResolvers ?? {};
    Object.entries(evmChains).forEach(([name, chain]) => {
      this.evmClients[name] = new EvmClient(chain);
    });
  }

  public getEvmClient(chain: string | AnyChain): EvmClient {
    const aChain = this.configService.getChain(chain);
    return this.evmClients[aChain.key];
  }

  public async getSubstrateService(
    chain: string | AnyChain
  ): Promise<SubstrateService> {
    const aChain = this.configService.getChain(chain);
    const evmResolver = this.evmResolvers[aChain.key];
    return await SubstrateService.create(
      aChain,
      this.configService,
      evmResolver
    );
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
    const srcSubstrate = await this.getSubstrateService(srcChain);
    const srcEd = srcSubstrate.existentialDeposit;
    const srcData = new TransferService(srcEvm, srcSubstrate);

    const destEvm = this.getEvmClient(destChain);
    const destSubstrate = await this.getSubstrateService(destChain);
    const destEd = destSubstrate.existentialDeposit;
    const destData = new TransferService(destEvm, destSubstrate);

    const [srcBalance, srcFeeBalance, srcMin, destBalance, destFee, destMin] =
      await Promise.all([
        srcData.getBalance(srcAddr, source),
        srcData.getFeeBalance(srcAddr, source),
        srcData.getMin(source),
        destData.getBalance(destAddr, destination),
        destData.getDestinationFee(source),
        destData.getMin(destination),
      ]);

    const srcFee = await srcData.getFee(
      srcAddr,
      srcBalance.amount,
      srcFeeBalance,
      destAddr,
      destination.chain,
      destFee,
      source
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
      transfer(amount): XCall {
        const config = buildTransfer(
          toBigInt(amount, srcBalance.decimals),
          destAddr,
          destination.chain,
          destFee,
          source
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
    const substrate = await this.getSubstrateService(chain);

    const balanceAdapter = new BalanceAdapter({
      evmClient,
      substrate,
    });

    const observables = chainConfig
      .getAssetsConfigs()
      .map(async (assetConfig) => {
        const { asset, balance } = assetConfig;
        const assetId = chainConfig.chain.getBalanceAssetId(asset);
        const resolvedAddr = await substrate.resolveAddress(
          address,
          assetId.toString()
        );
        const balanceConfig = balance.build({
          address: resolvedAddr,
          asset: assetId,
        });
        return balanceAdapter.subscribe(asset, balanceConfig);
      });
    const ob = await Promise.all(observables);
    const observable = combineLatest(ob);
    return observable.pipe(debounceTime(500)).subscribe(observer);
  }
}
