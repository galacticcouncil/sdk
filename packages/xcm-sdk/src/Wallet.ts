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
import { BalanceAdapter } from './adapters';
import {
  calculateMax,
  calculateMin,
  formatEvmAddress,
  TransferService,
} from './transfer';
import { XCall, XTransfer } from './types';

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

    const src = new TransferService(srcConf, this.dex);
    const dst = new TransferService(dstConf, this.dex);
    const validator = new TransferValidator(...this.validations);

    const [
      srcBalance,
      srcFeeBalance,
      srcMin,
      dstBalance,
      dstFee,
      dstFeeBalance,
      dstMin,
    ] = await Promise.all([
      src.getBalance(srcAddr),
      src.getFeeBalance(srcAddr),
      src.getMin(),
      dst.getBalance(dstAddr),
      src.getDestinationFee(),
      src.getDestinationFeeBalance(srcAddr),
      dst.getMin(),
    ]);

    const dstBalanceNormalized = srcBalance.copyWith({
      amount: dstBalance.amount,
    });

    const ctx: TransferCtx = {
      address: dstAddr,
      amount: srcBalance.amount,
      asset: srcConf.route.source.asset,
      destination: {
        balance: dstBalance,
        chain: dstConf.chain,
        fee: dstFee,
      },
      sender: srcAddr,
      source: {
        balance: srcBalance,
        chain: srcConf.chain,
        feeBalance: srcFeeBalance,
        feeBalanceDest: dstFeeBalance,
      },
    };

    console.log(ctx);

    const route = srcConf.route;
    const routedFromParachain = route.extrinsic && route.via;
    const routedFromEvm = route.contract && route.via;

    if (routedFromParachain) {
      const [transact, fee, feeBalance] = await Promise.all([
        src.getTransactInfo(ctx, route.via),
        src.getRouteFee(route.via),
        src.getRouteFeeBalance(ctx, route.via),
      ]);
      ctx.via = {
        chain: route.via.chain,
        fee: fee,
        feeBalance: feeBalance,
        transact: transact,
      };
    }

    if (routedFromEvm) {
      ctx.via = {
        chain: route.via.chain,
      };
    }

    const srcFee = await src.getFee(ctx);
    const srcFeeSwap = this.dex.isSwapSupported(srcFee, ctx)
      ? await this.dex.calculateFeeSwap(srcFee, ctx)
      : undefined;

    const dstEd = await dst.getEd();
    const min = calculateMin(dstBalanceNormalized, dstFee, dstMin, dstEd);

    const srcEd = await src.getEd();
    const max = calculateMax(srcBalance, srcFee, srcMin, srcEd);

    ctx.amount = 0n;
    ctx.source.fee = srcFee;
    ctx.source.feeSwap = srcFeeSwap;

    return {
      balance: srcBalance,
      dstFee,
      dstFeeBalance,
      max,
      min,
      srcFee,
      srcFeeBalance,
      srcFeeSwap,
      async buildCall(amount): Promise<XCall> {
        const ctxCp = Object.assign({}, ctx);
        ctxCp.amount = big.toBigInt(amount, srcBalance.decimals);
        return src.getCall(ctxCp);
      },
      async estimateFee(amount): Promise<AssetAmount> {
        const ctxCp = Object.assign({}, ctx);
        ctxCp.amount = big.toBigInt(amount, srcBalance.decimals);
        return src.getFee(ctxCp);
      },
      async validate(fee): Promise<TransferValidationReport[]> {
        const ctxCp = Object.assign({}, ctx);
        ctxCp.source.fee = fee ? srcFee.copyWith({ amount: fee }) : srcFee;
        return validator.validate(ctxCp);
      },
    } as XTransfer;
  }

  public async subscribeBalance(
    address: string,
    chain: string | AnyChain,
    observer: (balances: AssetAmount[]) => void
  ): Promise<Subscription> {
    const chainRoutes = this.config.getChainRoutes(chain);
    const balanceAdapter = new BalanceAdapter(chainRoutes.chain);

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
          asset: assetId,
        });
        return balanceAdapter.subscribe(asset, balanceConfig);
      });

    const ob = await Promise.all(observables);
    const observable = combineLatest(ob);
    return observable.pipe(debounceTime(500)).subscribe(observer);
  }
}
