import {
  Asset,
  AnyChain,
  AssetAmount,
  ConfigBuilder,
  ConfigService,
  isH160Address,
} from '@galacticcouncil/xcm-core';
import { toBigInt } from '@moonbeam-network/xcm-utils';
import { combineLatest, debounceTime, Subscription } from 'rxjs';
import { BalanceAdapter } from './adapters';
import {
  TransferService,
  calculateMax,
  calculateMin,
  getH16Address,
} from './transfer';
import { XCall, XData } from './types';

export interface WalletOptions {
  config: ConfigService;
}

export class Wallet {
  private readonly config: ConfigService;

  constructor({ config }: WalletOptions) {
    this.config = config;
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

    const src = new TransferService(srcConf.chain);
    const dst = new TransferService(dstConf.chain);

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

    const dstEd = await dst.metadata.getEd();
    const min = calculateMin(dstBalance, dstFee, dstMin, dstEd);

    const srcEd = await src.metadata.getEd();
    const max = calculateMax(srcBalance, srcFee, srcMin, srcEd);

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

  public async subscribeBalance(
    address: string,
    chain: string | AnyChain,
    observer: (balances: AssetAmount[]) => void
  ): Promise<Subscription> {
    const chainConfig = this.config.getChainConfig(chain);
    const balanceAdapter = new BalanceAdapter(chainConfig.chain);

    const observables = chainConfig
      .getUniqueAssetsConfigs()
      .map(async ({ asset, balance }) => {
        const { chain } = chainConfig;
        const assetId = chain.getBalanceAssetId(asset);
        const account = isH160Address(assetId.toString())
          ? await getH16Address(address, chain)
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
