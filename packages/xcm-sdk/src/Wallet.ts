import { PoolService } from '@galacticcouncil/sdk';
import {
  addr,
  big,
  Asset,
  AnyChain,
  AssetAmount,
  ConfigBuilder,
  ConfigService,
  TransferCtx,
  TransferValidator,
  TransferValidation,
  TransferValidationReport,
} from '@galacticcouncil/xcm-core';
import { combineLatest, debounceTime, Subscription } from 'rxjs';
import { PlatformAdapter, XCall } from './platforms';
import {
  calculateMax,
  calculateMin,
  formatEvmAddress,
  TransferDstData,
  TransferSrcData,
} from './transfer';
import { XTransfer } from './types';
import { Dex } from './Dex';

export interface WalletOptions {
  configService: ConfigService;
  poolService: PoolService;
  transferValidations?: TransferValidation[];
}

export class Wallet {
  readonly config: ConfigService;
  readonly dex: Dex;
  readonly validations: TransferValidation[];

  constructor({
    configService,
    poolService,
    transferValidations,
  }: WalletOptions) {
    this.config = configService;
    this.dex = new Dex(configService, poolService);
    this.validations = transferValidations || [];
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

    const srcConf = transfer.origin;
    const dstConf = transfer.reverse;

    const srcAdapter = new PlatformAdapter(srcConf.chain, this.dex);
    const dstAdapter = new PlatformAdapter(dstConf.chain, this.dex);

    const src = new TransferSrcData(srcAdapter, srcConf);
    const dst = new TransferDstData(dstAdapter, dstConf);
    const validator = new TransferValidator(...this.validations);

    const [
      srcBalance,
      srcFeeBalance,
      srcDestinationFee,
      srcDestinationFeeBalance,
      srcMin,
      dstBalance,
      dstMin,
    ] = await Promise.all([
      src.getBalance(srcAddr),
      src.getFeeBalance(srcAddr),
      src.getDestinationFee(),
      src.getDestinationFeeBalance(srcAddr),
      src.getMin(),
      dst.getBalance(dstAddr),
      dst.getMin(),
    ]);

    const { source, destination } = srcConf.route;

    // Normalize destination fee asset
    const dstFee = srcDestinationFee.copyWith(destination.fee.asset);

    const ctx: TransferCtx = {
      address: dstAddr,
      amount: srcBalance.amount,
      asset: source.asset,
      destination: {
        balance: dstBalance,
        chain: dstConf.chain,
        fee: dstFee,
      },
      sender: srcAddr,
      source: {
        balance: srcBalance,
        chain: srcConf.chain,
        fee: srcFeeBalance.copyWith({ amount: 0n }),
        feeBalance: srcFeeBalance,
        destinationFee: srcDestinationFee,
        destinationFeeBalance: srcDestinationFeeBalance,
      },
    };

    ctx.transact = await src.getTransact(ctx);

    const srcFee = await src.getFee(ctx);
    const srcFeeSwap = this.dex.isSwapSupported(srcFee, ctx)
      ? await this.dex.calculateFeeSwap(srcFee, ctx)
      : undefined;

    const dstEd = await dst.getEd();
    const min = calculateMin(dstBalance, dstFee, dstMin, dstEd);

    const srcEd = await src.getEd();
    const max = calculateMax(srcBalance, srcFee, srcMin, srcEd);

    ctx.amount = 0n;
    ctx.source.fee = srcFee;
    ctx.source.feeSwap = srcFeeSwap;

    return {
      source: {
        balance: srcBalance,
        destinationFee: srcDestinationFee,
        destinationFeeBalance: srcDestinationFeeBalance,
        fee: srcFee,
        feeBalance: srcFeeBalance,
        feeSwap: srcFeeSwap,
        max,
        min: srcBalance.copyWith({ amount: min.amount }),
      },
      destination: {
        balance: dstBalance,
        fee: dstFee,
      },
      async buildCall(amount): Promise<XCall> {
        const copyCtx = Object.assign({}, ctx);
        copyCtx.amount = big.toBigInt(amount, srcBalance.decimals);
        copyCtx.transact = await src.getTransact(copyCtx);
        return src.getCall(copyCtx);
      },
      async estimateFee(amount): Promise<AssetAmount> {
        const copyCtx = Object.assign({}, ctx);
        copyCtx.amount = big.toBigInt(amount, srcBalance.decimals);
        copyCtx.transact = await src.getTransact(copyCtx);
        return src.getFee(copyCtx);
      },
      async validate(fee): Promise<TransferValidationReport[]> {
        const copyCtx = Object.assign({}, ctx);
        const srcFeeAmount = fee || srcFee.amount;
        copyCtx.source.fee = srcFee.copyWith({ amount: srcFeeAmount });
        return validator.validate(copyCtx);
      },
    } as XTransfer;
  }

  public async subscribeBalance(
    address: string,
    chain: string | AnyChain,
    observer: (balances: AssetAmount[]) => void
  ): Promise<Subscription> {
    const chainRoutes = this.config.getChainRoutes(chain);
    const adapter = new PlatformAdapter(chainRoutes.chain, this.dex);
    const observables = chainRoutes
      .getUniqueRoutes()
      .map(async ({ source }) => {
        const { asset, balance } = source;
        const assetId = chainRoutes.chain.getBalanceAssetId(asset);
        const account = addr.isH160(assetId.toString())
          ? await formatEvmAddress(address, chainRoutes.chain)
          : address;
        const balanceConfig = balance.build({
          address: account,
          asset: asset,
          chain: chainRoutes.chain,
        });
        return adapter.subscribeBalance(asset, balanceConfig);
      });

    const ob = await Promise.all(observables);
    const observable = combineLatest(ob);
    return observable.pipe(debounceTime(500)).subscribe(observer);
  }
}
