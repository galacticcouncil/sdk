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
  SwapFactory,
  Swap,
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

import { Swapper } from './Swapper';

export interface WalletOptions {
  configService: ConfigService;
  transferValidations?: TransferValidation[];
}

export class Wallet {
  readonly config: ConfigService;
  readonly validations: TransferValidation[];

  constructor({ configService, transferValidations }: WalletOptions) {
    this.config = configService;
    this.validations = transferValidations || [];
  }

  registerSwaps(...swaps: Swap[]) {
    swaps.forEach((s) => SwapFactory.getInstance().register(s));
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

    const srcAdapter = new PlatformAdapter(srcConf.chain);
    const dstAdapter = new PlatformAdapter(dstConf.chain);

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

    const swapper = new Swapper(ctx);

    const srcFee = await src.getFee(ctx);
    const srcFeeSwap = swapper.isSwapSupported(srcFee)
      ? await swapper.calculateFeeSwap(srcFee)
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
    const adapter = new PlatformAdapter(chainRoutes.chain);
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
