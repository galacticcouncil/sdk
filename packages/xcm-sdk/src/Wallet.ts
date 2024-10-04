import { PoolService } from '@galacticcouncil/sdk';
import {
  addr,
  big,
  Asset,
  AnyChain,
  AssetAmount,
  ConfigBuilder,
  ConfigService,
  TransferData,
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
  private readonly config: ConfigService;
  private readonly dex: Dex;
  private readonly validations: TransferValidation[];

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

    const srcConf = transfer.source;
    const dstConf = transfer.destination;

    const src = new TransferService(srcConf.chain, this.dex);
    const dst = new TransferService(dstConf.chain, this.dex);
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
      src.getBalance(srcAddr, srcConf),
      src.getFeeBalance(srcAddr, srcConf),
      src.getMin(srcConf),
      dst.getBalance(dstAddr, dstConf),
      dst.getDestinationFee(srcConf),
      src.getDestinationFeeBalance(srcAddr, srcConf),
      dst.getMin(dstConf),
    ]);

    const dstBalanceNormalized = srcBalance.copyWith({
      amount: dstBalance.amount,
    });

    const transferData: TransferData = {
      address: dstAddr,
      amount: srcBalance.amount,
      asset: transfer.asset,
      destination: {
        balance: dstBalanceNormalized,
        chain: dstConf.chain,
        fee: dstFee,
        feeBalance: dstFeeBalance,
      },
      sender: srcAddr,
      source: {
        balance: srcBalance,
        chain: srcConf.chain,
        feeBalance: srcFeeBalance,
      },
    };

    const route = srcConf.config;
    const routedFromParachain = route.extrinsic && route.via;
    const routedFromEvm = route.contract && route.via;

    if (routedFromParachain) {
      const [transact, fee, feeBalance] = await Promise.all([
        src.getTransactInfo(transferData, route.via),
        src.getRouteFee(route.via),
        src.getRouteFeeBalance(transferData, route.via),
      ]);
      transferData.via = {
        chain: route.via.chain,
        fee: fee,
        feeBalance: feeBalance,
        transact: transact,
      };
    }

    if (routedFromEvm) {
      transferData.via = {
        chain: route.via.chain,
      };
    }

    const srcFee = await src.getFee(transferData, srcConf);
    const srcFeeSwap = this.dex.isSwapSupported(srcFee, transferData)
      ? await this.dex.calculateFeeSwap(srcFee, transferData)
      : undefined;

    const dstEd = await dst.metadata.getEd();
    const min = calculateMin(dstBalanceNormalized, dstFee, dstMin, dstEd);

    const srcEd = await src.metadata.getEd();
    const max = calculateMax(srcBalance, srcFee, srcMin, srcEd);

    transferData.amount = 0n;
    transferData.source.fee = srcFee;
    transferData.source.feeSwap = srcFeeSwap;

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
        const data = Object.assign({}, transferData);
        data.amount = big.toBigInt(amount, srcBalance.decimals);
        return src.getCall(data, srcConf);
      },
      async estimateFee(amount): Promise<AssetAmount> {
        const data = Object.assign({}, transferData);
        data.amount = big.toBigInt(amount, srcBalance.decimals);
        return src.getFee(data, srcConf);
      },
      async validate(fee): Promise<TransferValidationReport[]> {
        const data = Object.assign({}, transferData);
        data.source.fee = fee ? srcFee.copyWith({ amount: fee }) : srcFee;
        return validator.validate(data);
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
          ? await formatEvmAddress(address, chain)
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
