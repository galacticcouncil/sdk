import {
  addr,
  big,
  Asset,
  AnyChain,
  AssetAmount,
  ConfigBuilder,
  ConfigService,
} from '@galacticcouncil/xcm-core';
import { combineLatest, debounceTime, Subscription } from 'rxjs';
import { BalanceAdapter } from './adapters';
import {
  TransferService,
  calculateMax,
  calculateMin,
  getH16Address,
} from './transfer';
import { XCall, XTransfer } from './types';

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
  ): Promise<XTransfer> {
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

    const [srcBalance, srcFeeBalance, srcMin, dstFee, dstMin] =
      await Promise.all([
        src.getBalance(srcAddr, srcConf),
        src.getFeeBalance(srcAddr, srcConf),
        src.getMin(srcConf),
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
    const min = calculateMin(srcBalance, dstFee, dstMin, dstEd);

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
          big.toBigInt(amount, srcBalance.decimals),
          dstAddr,
          dstConf.chain,
          dstFee,
          srcConf
        );
      },
      async estimateFee(amount): Promise<AssetAmount> {
        return src.getFee(
          srcAddr,
          big.toBigInt(amount, srcBalance.decimals),
          srcFeeBalance,
          dstAddr,
          dstConf.chain,
          dstFee,
          srcConf
        );
      },
    } as XTransfer;
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
        const account = addr.isH160(assetId.toString())
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
