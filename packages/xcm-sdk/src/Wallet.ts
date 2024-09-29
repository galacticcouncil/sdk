import {
  buildRoute,
  PoolService,
  PoolType,
  TradeRouter,
} from '@galacticcouncil/sdk';
import {
  addr,
  big,
  Asset,
  AnyChain,
  AssetAmount,
  ConfigBuilder,
  ConfigService,
  TransferData,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { combineLatest, debounceTime, Subscription } from 'rxjs';
import { BalanceAdapter } from './adapters';
import {
  TransferService,
  calculateMax,
  calculateMin,
  getH160Address,
} from './transfer';
import { Dex, XCall, XTransfer } from './types';

const DEX_PARACHAIN_ID = 2034;

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

  get dex(): Dex {
    const chains = this.config.chains.values();
    const hydration = Array.from(chains).find(
      (c) => c instanceof Parachain && c.parachainId === DEX_PARACHAIN_ID
    );

    if (hydration) {
      return {
        chain: hydration,
        router: this.router,
      } as Dex;
    }
    throw new Error('Hydration DEX chain config not found');
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
      amount: 0n,
      asset: transfer.asset,
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

    const isSufficientPaymentAsset = transfer.asset.isEqual(dstFee);
    if (!isSufficientPaymentAsset) {
      // If not sufficient asset calculate dest fee exchange rate
      const assetIn = this.dex.chain.getMetadataAssetId(srcFeeBalance);
      const assetOut = this.dex.chain.getMetadataAssetId(dstFee);
      const amountOut = dstFee.toDecimal(dstFee.decimals);

      const trade = await this.router.getBestBuy(
        assetIn.toString(),
        assetOut.toString(),
        amountOut
      );
      const swap = {
        amount: BigInt(trade.amountIn.toNumber()),
        route: buildRoute(trade.swaps),
      };
      transferData.swap = swap;
    }

    const srcFee = await src.getFee(transferData, srcConf);

    const dstEd = await dst.metadata.getEd();
    const min = calculateMin(
      srcBalance.copyWith({ amount: dstBalance.amount }),
      dstFee,
      dstMin,
      dstEd
    );

    const srcEd = await src.metadata.getEd();
    const max = calculateMax(srcBalance, srcFee, srcMin, srcEd);

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
