import {
  addr,
  big,
  Asset,
  AnyChain,
  AssetAmount,
  ConfigBuilder,
  ConfigService,
  Dex,
  DexFactory,
  TransferCtx,
  TransferValidator,
  TransferValidation,
  TransferValidationReport,
} from '@galacticcouncil/xcm-core';
import { combineLatest, debounceTime, Subscription } from 'rxjs';

import { PlatformAdapter, Call } from './platforms';
import {
  calculateMax,
  calculateMin,
  formatEvmAddress,
  DataOriginProcessor,
  DataReverseProcessor,
} from './transfer';
import { Transfer } from './types';

import { FeeSwap } from './FeeSwap';

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

  registerDex(...dex: Dex[]) {
    dex.forEach((x) => DexFactory.getInstance().register(x));
  }

  public async transfer(
    asset: string | Asset,
    srcAddr: string,
    srcChain: string | AnyChain,
    dstAddr: string,
    dstChain: string | AnyChain
  ): Promise<Transfer> {
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

    const src = new DataOriginProcessor(srcAdapter, srcConf);
    const dst = new DataReverseProcessor(dstAdapter, dstConf);
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
      amount: 1n, // Use 1 satoshi as init amount
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

    const swap = new FeeSwap(ctx);

    let srcFeeSwap;
    if (swap.isSwapSupported(srcFee)) {
      srcFeeSwap = await swap.getSwap(srcFee);
    }

    let srcDestinationFeeSwap;
    if (swap.isDestinationSwapSupported(srcFee)) {
      srcDestinationFeeSwap = await swap.getDestinationSwap(srcFee);
    }

    const dstEd = await dst.getEd();
    const min = calculateMin(dstBalance, dstFee, dstMin, dstEd);

    const srcEd = await src.getEd();
    // In case of active fee swap use effective fee to calculate max
    const srcEffectiveFee =
      srcFeeSwap && srcFeeSwap.enabled ? srcFeeSwap.aIn : srcFee;
    const max = calculateMax(srcBalance, srcEffectiveFee, srcMin, srcEd);

    ctx.amount = 0n;
    ctx.source.fee = srcFee;
    ctx.source.feeSwap = srcFeeSwap;
    ctx.source.destinationFeeSwap = srcDestinationFeeSwap;

    return {
      source: {
        balance: srcBalance,
        destinationFee: srcDestinationFee,
        destinationFeeBalance: srcDestinationFeeBalance,
        destinationFeeSwap: srcDestinationFeeSwap,
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
      async buildCall(amount): Promise<Call> {
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
    } as Transfer;
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
