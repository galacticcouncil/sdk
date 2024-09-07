import { PoolService, PoolType, TradeRouter } from '@galacticcouncil/sdk';
import {
  addr,
  big,
  Asset,
  AnyChain,
  AssetAmount,
  ConfigBuilder,
  ConfigService,
  TransferData,
} from '@galacticcouncil/xcm-core';
import { combineLatest, debounceTime, Subscription } from 'rxjs';
import { BalanceAdapter } from './adapters';
import {
  TransferService,
  calculateMax,
  calculateMin,
  getH160Address,
} from './transfer';
import { XCall, XTransfer } from './types';

export interface WalletOptions {
  configService: ConfigService;
  poolService: PoolService;
}

export class Wallet {
  private readonly config: ConfigService;
  private readonly router: TradeRouter;

  constructor({ configService, poolService }: WalletOptions) {
    this.config = configService;
    this.router = new TradeRouter(poolService, {
      includeOnly: [PoolType.Omni, PoolType.Stable],
    });
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

    const src = new TransferService(srcConf.chain, this.router);
    const dst = new TransferService(dstConf.chain, this.router);

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

    const transferData: TransferData = {
      address: dstAddr,
      amount: srcBalance.amount,
      asset: srcBalance,
      balance: srcBalance,
      destination: {
        chain: dstConf.chain,
        fee: dstFee,
        feeBalance: dstFeeBalance,
      },
      sender: srcAddr,
      source: {
        chain: srcConf.chain,
        feeBalance: srcFeeBalance,
      },
    };

    const srcFee = await src.getFee(transferData, srcConf);

    const dstEd = await dst.metadata.getEd();
    const min = calculateMin(dstBalance, dstFee, dstMin, dstEd);

    const srcEd = await src.metadata.getEd();
    const max = calculateMax(srcBalance, srcFee, srcMin, srcEd);

    const isSufficientPaymentAsset = transfer.asset.isEqual(dstFee);
    if (!isSufficientPaymentAsset) {
      // if not sufficient asset calculate swap rate
    }

    return {
      balance: srcBalance,
      dstFee,
      dstFeeBalance,
      max,
      min,
      srcFee,
      srcFeeBalance,
      async buildCall(amount): Promise<XCall> {
        const transferDataCopy = Object.assign({}, transferData);
        transferDataCopy.amount = big.toBigInt(amount, srcBalance.decimals);
        transferDataCopy.source.fee = srcFee;
        return src.getCall(transferDataCopy, srcConf);
      },
      async estimateFee(amount): Promise<AssetAmount> {
        const transferDataCopy = Object.assign({}, transferData);
        transferDataCopy.amount = big.toBigInt(amount, srcBalance.decimals);
        return src.getFee(transferDataCopy, srcConf);
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
          ? await getH160Address(address, chain)
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
