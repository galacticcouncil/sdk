import { big } from '@galacticcouncil/common';

import {
  acc,
  addr,
  Asset,
  AnyChain,
  AnyParachain,
  AssetAmount,
  ConfigBuilder,
  ConfigService,
  Dex,
  DexFactory,
  TransferConfigs,
  TransferCtx,
  TransferValidator,
  TransferValidation,
  TransferValidationReport,
} from '@galacticcouncil/xc-core';

import { combineLatest, debounceTime, Subscription } from 'rxjs';

import {
  Call,
  PlatformAdapter,
  SubstrateCall,
  SubstrateExec,
  SubstrateService,
} from './platforms';
import {
  calculateMax,
  calculateMin,
  formatEvmAddress,
  DataOriginProcessor,
  DataReverseProcessor,
} from './transfer';
import { Transfer } from './types';

import { FeeSwap } from './FeeSwap';

const { EvmAddr } = addr;

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

  async transfer(
    asset: string | Asset,
    srcAddress: string,
    srcChain: string | AnyChain,
    dstAddress: string,
    dstChain: string | AnyChain
  ): Promise<Transfer> {
    const transfer = ConfigBuilder(this.config)
      .assets()
      .asset(asset)
      .source(srcChain)
      .destination(dstChain)
      .build();
    return this.getTransferData(transfer, srcAddress, dstAddress);
  }

  async remoteXcm(
    srcAddress: string,
    srcChain: string | AnyParachain,
    dstChain: string | AnyParachain,
    dstCall: SubstrateCall,
    opts: {
      srcFeeAsset?: Asset;
    } = {}
  ): Promise<SubstrateCall> {
    const src = this.config.getChain(srcChain) as AnyParachain;
    const dst = this.config.getChain(dstChain) as AnyParachain;

    const isSubstrateExec = src.isSubstrate() && dst.isSubstrate();
    if (!isSubstrateExec)
      throw Error('RemoteXcm is supported only between parachains');

    const [srcSub, dstSub] = await Promise.all([
      SubstrateService.create(src),
      SubstrateService.create(dst),
    ]);

    const exec = new SubstrateExec(srcSub, dstSub);

    const dstAddress = acc.getMultilocationDerivatedAccount(
      src.parachainId,
      srcAddress,
      1,
      dst.usesH160Acc
    );

    const dstAsset = await dstSub.getAsset();
    const transfer = await this.transfer(
      dstAsset,
      srcAddress,
      srcChain,
      dstAddress,
      dstChain
    );

    return exec.remoteExec(
      srcAddress,
      dstAddress,
      dstCall,
      (fees) => {
        const feesFmt = fees.toDecimal();
        return transfer.buildCall(feesFmt);
      },
      opts
    );
  }

  async getTransferData(
    configs: TransferConfigs,
    srcAddress: string,
    dstAddress: string
  ): Promise<Transfer> {
    const srcConf = configs.origin;
    const dstConf = configs.reverse;

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
      src.getBalance(srcAddress),
      src.getFeeBalance(srcAddress),
      src.getDestinationFee(),
      src.getDestinationFeeBalance(srcAddress),
      src.getMin(),
      dst.getBalance(dstAddress),
      dst.getMin(),
    ]);

    const { source, destination } = srcConf.route;

    // Normalize destination fee asset
    const dstFee = srcDestinationFee.fee.copyWith(destination.fee.asset);
    const dstFeeBreakdown = srcDestinationFee.feeBreakdown;

    const ctx: TransferCtx = {
      address: dstAddress,
      amount: 1n, // Use 1 satoshi as init amount
      asset: source.asset,
      destination: {
        balance: dstBalance,
        chain: dstConf.chain,
        fee: dstFee,
        feeBreakdown: dstFeeBreakdown,
      },
      sender: srcAddress,
      source: {
        balance: srcBalance,
        chain: srcConf.chain,
        fee: srcFeeBalance.copyWith({ amount: 0n }),
        feeBalance: srcFeeBalance,
        destinationFee: srcDestinationFee.fee,
        destinationFeeBalance: srcDestinationFeeBalance,
      },
    };

    ctx.transact = await src.getTransact(ctx);

    const swap = new FeeSwap(ctx);

    let srcFee = await src.getFee(ctx);
    let srcFeeSwap;
    if (swap.isSwapSupported(source.fee)) {
      srcFeeSwap = await swap.getSwap(srcFee);
      ctx.source.feeSwap = srcFeeSwap;
    }

    let srcDestinationFeeSwap;
    if (swap.isDestinationSwapSupported(srcFee)) {
      srcDestinationFeeSwap = await swap.getDestinationSwap(srcFee);
      ctx.source.destinationFeeSwap = srcDestinationFeeSwap;
    }

    if (srcFeeSwap || srcDestinationFeeSwap) {
      // Re-estimate fee if fee swap & add 5% margin
      srcFee = await src.getFee(ctx);
      srcFee = srcFee.padByPct(5n);
    }

    const dstEd = await dst.getEd();
    const min = calculateMin(dstBalance, dstFee, dstMin, dstEd);

    const srcEd = await src.getEd();
    const srcRentReserve = src.getRentReserve();
    const max = calculateMax(srcBalance, srcFee, srcMin, srcEd, srcRentReserve);

    ctx.amount = 0n;
    ctx.source.fee = srcFee;

    return {
      source: {
        balance: srcBalance,
        destinationFee: srcDestinationFee.fee,
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

  async subscribeBalance(
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
        const account = EvmAddr.isValid(assetId.toString())
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
